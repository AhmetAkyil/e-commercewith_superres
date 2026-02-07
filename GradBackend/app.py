from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os, uuid, json, sys, subprocess
from PIL import Image, ImageFilter, ImageDraw
import torch, clip
from ultralytics import YOLO

app = Flask(__name__)
CORS(app)

UPLOAD_DIR = "uploads"
OUT_DIR = "out"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUT_DIR, exist_ok=True)

# PREPAREMENT OF MODELS
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
CLIP_MODEL, CLIP_PREPROCESS = clip.load("ViT-B/32", device=DEVICE)
YOLO_MODEL = YOLO("yolo11s.pt")
YOLO_DEVICE = 0 if DEVICE == "cuda" else "cpu"

REALESRGAN_SCRIPT = os.path.join("Real-ESRGAN", "inference_realesrgan.py")
MODEL_30KR = os.path.join("Real-ESRGAN", "weights", "30kR.pth")


# CATEGORY CONFIGS FOR DEMO
CATEGORY_CONFIGS = {
    "laptop": {
        "allowedYoloClasses": ["laptop", "keyboard", "mouse", "cell phone", "monitor", "tv", "remote"],
        "subcategoriesByClass": {
            "laptop": ["ultrabook", "gaming laptop", "business laptop", "thin laptop"],
            "keyboard": ["mechanical keyboard", "wireless keyboard"],
            "mouse": ["gaming mouse", "wireless mouse"],
        },
        "relatedTags": {
            "ultrabook": ["thin laptop", "lightweight"],
            "gaming laptop": ["rgb keyboard", "high performance"],
            "business laptop": ["professional", "long battery life"],
            "mechanical keyboard": ["rgb keyboard", "gaming keyboard"],
            "wireless mouse": ["bluetooth", "portable"],
        },
        "maxTags": 20,
    },
    "phone": {
        "allowedYoloClasses": ["cell phone", "remote", "keyboard", "mouse"],
        "subcategoriesByClass": {
            "cell phone": ["android phone", "iphone", "foldable phone"],
        },
        "relatedTags": {
            "android phone": ["fast charging", "usb-c"],
            "iphone": ["lightning cable", "ios"],
            "foldable phone": ["flex display"],
        },
        "maxTags": 15,
    },
    "monitor": {
        "allowedYoloClasses": ["monitor", "tv", "keyboard", "mouse", "remote", "laptop"],
        "subcategoriesByClass": {
            "monitor": ["gaming monitor", "office monitor", "curved monitor", "4k monitor"],
        },
        "relatedTags": {
            "gaming monitor": ["144hz", "1ms"],
            "curved monitor": ["immersive"],
            "4k monitor": ["high resolution"],
        },
        "maxTags": 15,
    },
}

# Example tag suggestions for demo
SUGGESTED_TAGS = {
    "laptop": ["laptop", "ultrabook", "gaming laptop", "ssd", "ram", "usb-c", "backlit keyboard"],
    "phone": ["smartphone", "android", "iphone", "fast charging", "oled", "phone case"],
    "monitor": ["monitor", "gaming monitor", "144hz", "4k", "hdr", "displayport"],
}

@app.route("/suggested-tags", methods=["GET"])
def suggested_tags():
    category = (request.args.get("category") or "laptop").strip().lower()
    return jsonify({
        "category": category,
        "suggestedTags": SUGGESTED_TAGS.get(category, SUGGESTED_TAGS["laptop"])
    })

def merge_config(category: str, incoming: dict) -> dict:
    base = CATEGORY_CONFIGS.get(category, CATEGORY_CONFIGS["laptop"])
    merged = dict(base)
    for k, v in (incoming or {}).items():
        merged[k] = v
    return merged

def generate_tags(image_path: str, config: dict):
    allowed = set(config.get("allowedYoloClasses", []))
    sub_by_class = config.get("subcategoriesByClass", {})
    related = config.get("relatedTags", {})
    max_tags = int(config.get("maxTags", 20))

    img = Image.open(image_path).convert("RGB")
    results = YOLO_MODEL.predict(source=img, conf=0.10, imgsz=640, device=YOLO_DEVICE)
    res = results[0]

    final_tags = set()

    for box in res.boxes:
        cls_name = YOLO_MODEL.names[int(box.cls[0])]

        if allowed and cls_name not in allowed:
            continue

        x1, y1, x2, y2 = box.xyxy[0].int().tolist()
        crop = img.crop((x1, y1, x2, y2))

        img_in = CLIP_PREPROCESS(crop).unsqueeze(0).to(DEVICE)
        with torch.no_grad():
            i_feat = CLIP_MODEL.encode_image(img_in)

        if cls_name in sub_by_class and len(sub_by_class[cls_name]) > 0:
            subs = sub_by_class[cls_name]
            prompts = [f"a photo of {s}" for s in subs]
            txt_tokens = clip.tokenize(prompts).to(DEVICE)

            with torch.no_grad():
                t_feat = CLIP_MODEL.encode_text(txt_tokens)
                logits = (i_feat @ t_feat.T) / 0.07
                probs = logits.softmax(dim=1)[0].cpu().numpy()

            best = subs[int(probs.argmax())]
            final_tags.add(best)
        else:
            final_tags.add(cls_name)

    expanded = set(final_tags)
    for t in list(final_tags):
        for rt in related.get(t, []):
            expanded.add(rt)

    return list(list(expanded)[:max_tags])

@app.route("/process", methods=["POST"])
def process():
    if "image" not in request.files:
        return jsonify({"error": "image required"}), 400

    # front: name + category + tags(string) + image + scale
    name = request.form.get("name", "")
    category = (request.form.get("category") or "laptop").strip().lower()

    config_raw = request.form.get("config", "{}")
    try:
        incoming_config = json.loads(config_raw) if config_raw else {}
    except:
        return jsonify({"error": "config must be valid json"}), 400

    config = merge_config(category, incoming_config)

    file = request.files["image"]
    req_id = uuid.uuid4().hex
    upload_path = os.path.join(UPLOAD_DIR, f"{req_id}.jpg")
    file.save(upload_path)

    # FULL SR
    subprocess.run([
        sys.executable, REALESRGAN_SCRIPT,
        "-i", upload_path,
        "-o", OUT_DIR,
        "-n", "RealESRGAN_x4plus",
        "-s", "4",
        "--tile", "768",
        "--tile_pad", "10",
        "--suffix", "sr",
    ], check=True)

    sr_full_path = os.path.join(OUT_DIR, f"{req_id}_sr.jpg")

    #laptop tespiti
    img = Image.open(upload_path).convert("RGB")
    results = YOLO_MODEL.predict(source=img, conf=0.10, imgsz=640, device=YOLO_DEVICE)
    laptop_box = None

    for box in results[0].boxes:
        cls_name = YOLO_MODEL.names[int(box.cls[0])].lower()
        if "laptop" in cls_name:
            x1, y1, x2, y2 = box.xyxy[0].int().tolist()
            laptop_box = (x1, y1, x2, y2)
            break

    final_path = os.path.join(OUT_DIR, f"{req_id}_final.png")

    if laptop_box:
        laptop_crop_path = os.path.join(UPLOAD_DIR, f"{req_id}_laptop.jpg")
        img.crop(laptop_box).save(laptop_crop_path)

        subprocess.run([
            sys.executable, REALESRGAN_SCRIPT,
            "-i", laptop_crop_path,
            "-o", OUT_DIR,
            "-n", "30kR",
            "-s", "4",
            "--tile", "768",
            "--tile_pad", "10",
            "--model_path", MODEL_30KR,
            "--suffix", "sr",
        ], check=True)

        sr_laptop_path = os.path.join(OUT_DIR, f"{req_id}_laptop_sr.jpg")

        full_sr = Image.open(sr_full_path).convert("RGBA")
        laptop_sr = Image.open(sr_laptop_path).convert("RGBA")

        mask = Image.new("L", laptop_sr.size, 0)
        draw = ImageDraw.Draw(mask)
        radius = 30
        draw.rectangle([radius, radius, laptop_sr.width - radius, laptop_sr.height - radius], fill=255)
        mask = mask.filter(ImageFilter.GaussianBlur(radius=radius))

        x1_sr, y1_sr = laptop_box[0] * 4, laptop_box[1] * 4
        bg_crop = full_sr.crop((x1_sr, y1_sr, x1_sr + laptop_sr.width, y1_sr + laptop_sr.height))
        blended = Image.composite(laptop_sr, bg_crop, mask)
        full_sr.paste(blended, (x1_sr, y1_sr))

        full_sr.convert("RGB").save(final_path)
    else:
        Image.open(sr_full_path).convert("RGB").save(final_path)

    generated_tags = generate_tags(final_path, config)


    orig_img = Image.open(upload_path)
    enh_img = Image.open(final_path)

    original_rel = f"/uploads/{os.path.basename(upload_path)}"
    enhanced_rel = f"/out/{os.path.basename(final_path)}"

    return jsonify({
        "name": name,
        "category": category,
        "generatedTags": generated_tags,


        "originalImage": original_rel,
        "enhancedImage": enhanced_rel,


        "originalResolution": [orig_img.width, orig_img.height],
        "enhancedResolution": [enh_img.width, enh_img.height],


        "enhancedImageName": os.path.basename(final_path),
        "enhancedImageUrl": request.host_url.rstrip("/") + enhanced_rel,
    })

# Frontend /upload çağırıyorsa alias
@app.route("/upload", methods=["POST"])
def upload_alias():
    return process()

@app.route("/out/<filename>")
def get_out(filename):
    return send_from_directory(OUT_DIR, filename)

@app.route("/uploads/<filename>")
def get_upload(filename):
    return send_from_directory(UPLOAD_DIR, filename)

@app.route("/download/<filename>")
def download(filename):
    return send_from_directory(OUT_DIR, filename, as_attachment=True)

if __name__ == "__main__":
    app.run(port=5000, debug=True)
