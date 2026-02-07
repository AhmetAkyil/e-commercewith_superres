import React, { useState, useRef } from "react";
import axios from "axios";
import CompareImage from "react-compare-image";

const ProductForm = () => {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [tags, setTags] = useState([]);
    const [newTag, setNewTag] = useState("");
    const [image, setImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [result, setResult] = useState(null);
    const [scale, setScale] = useState("4");
    const [isUploading, setIsUploading] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [step, setStep] = useState(0); // 0: form, 1: result, 2: confirmed
    const fileInputRef = useRef(null);

    const resetForm = () => {
        setName("");
        setCategory("");
        setTags([]);
        setNewTag("");
        setImage(null);
        setPreviewUrl(null);
        setResult(null);
        setScale("4");
        setIsUploading(false);
        setIsConfirmed(false);
    };

    const handleImageChange = (file) => {
        setImage(file);
        setPreviewUrl(URL.createObjectURL(file));
        setResult(null);
        setIsConfirmed(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleImageChange(file);
    };

    const handleDragOver = (e) => e.preventDefault();

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) handleImageChange(file);
    };

    const handleTagClick = (tag, e) => {
        e.stopPropagation();
        if (!tags.includes(tag)) {
            setTags([...tags, tag]);
            setResult(prev => {
                if (!prev) return prev;
                const updatedGeneratedTags = prev.generatedTags?.filter(t => t !== tag) || [];
                return { ...prev, generatedTags: updatedGeneratedTags };
            });
        }
    };

    const handleTagRemove = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleNewTagAdd = () => {
        const trimmed = newTag.trim();
        if (trimmed && !tags.includes(trimmed)) {
            setTags([...tags, trimmed]);
        }
        setNewTag("");
    };

    const handleSubmit = async () => {
        if (!name || !category || !image) {
            alert("Please fill in all fields");
            return;
        }

        const formData = new FormData();
        formData.append("name", name);
        formData.append("category", category);
        formData.append("tags", tags.join(", "));
        formData.append("image", image);
        formData.append("scale", scale);

        try {
            setIsUploading(true);
            const res = await axios.post("http://localhost:5000/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setResult(res.data);
            setStep(1); // go to result screen
        } catch (err) {
            console.error("Upload error:", err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleConfirm = () => {
        setIsConfirmed(true);
        setStep(2); // go to confirmed screen
    };
    const handleResubmit = async (imageUrl) => {
        try {
            const response = await fetch(`http://localhost:5000${imageUrl}`);
            const blob = await response.blob();
            const file = new File([blob], "enhanced.jpg", { type: blob.type });

            const formData = new FormData();
            formData.append("name", name);
            formData.append("category", category);
            formData.append("tags", tags.join(", "));
            formData.append("image", file);
            formData.append("scale", scale);  // scale yine 4 olabilir

            setIsUploading(true);
            const res = await axios.post("http://localhost:5000/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setResult(res.data);
            setStep(1);  // tekrar sonuç ekranına dön
        } catch (err) {
            console.error("Resubmit error:", err);
        } finally {
            setIsUploading(false);
        }
    };


    return (
        <div style={styles.container}>
            {step === 0 && (
                <div style={styles.leftPanel}>
                    <h2 style={styles.heading}>🛒 Product Details</h2>
                    <form onSubmit={(e) => e.preventDefault()} style={styles.form}>
                        <input
                            type="text"
                            placeholder="Product Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={styles.input}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            style={styles.input}
                            required
                        />
                        <select
                            value={scale}
                            onChange={(e) => setScale(e.target.value)}
                            style={styles.input}
                        >

                            <option value="4">Upscale: 4x (default)</option>
                        </select>


                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <input
                                type="text"
                                placeholder="Add tag"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                style={styles.input}
                            />
                            <button type="button" onClick={handleNewTagAdd} style={styles.button}>Add</button>
                        </div>

                        <div style={styles.suggestionBox}>
                            {tags.map((tag, i) => (
                                <div key={i} style={styles.tagItem}>
                                    {tag}
                                    <span onClick={() => handleTagRemove(tag)} style={styles.removeBtn}>×</span>
                                </div>
                            ))}
                        </div>

                        <div
                            style={styles.uploadBox}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onClick={() => fileInputRef.current.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                style={{ display: "none" }}
                            />
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" style={styles.resultImage} />
                            ) : (
                                <p style={{ textAlign: "center", color: "#888" }}>Drag & drop image here</p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            style={styles.button}
                            disabled={isUploading}
                        >
                            {isUploading ? "Uploading..." : "Save Product"}
                        </button>
                    </form>
                </div>
            )}

            {step === 1 && result && (
                <div style={styles.resultPanel}>
                    <h2 style={styles.heading}>Product Name: {result.name}</h2>
                    <p><strong>Category:</strong> {result.category}</p>
                    <p><strong>Tags:</strong></p>
                    <div style={styles.suggestionBox}>
                        {tags.map((tag, i) => (
                            <div key={i} style={styles.tagItem}>
                                {tag}
                                <span onClick={() => handleTagRemove(tag)} style={styles.removeBtn}>×</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: "2rem" }}>
                        <h4 style={styles.subHeading}>Before / After Comparison</h4>
                        <CompareImage
                            leftImage={`http://localhost:5000${result.originalImage}`}
                            rightImage={`http://localhost:5000${result.enhancedImage}`}
                            leftImageLabel="Original"
                            rightImageLabel="Upscaled"
                            sliderLineColor="#007bff"
                            sliderPositionPercentage={0.5}
                        />
                    </div>
                    <div style={{ marginTop: "1rem", fontSize: "0.95rem", color: "#555" }}>
                        <p><strong>Original Resolution:</strong> {result.originalResolution?.[1]}×{result.originalResolution?.[0]}</p>
                        <p><strong>Enhanced Resolution:</strong> {result.enhancedResolution?.[1]}×{result.enhancedResolution?.[0]}</p>

                    </div>

                    <button
                        type="button"
                        onClick={() => handleResubmit(result.enhancedImage)}
                        style={{ ...styles.button, backgroundColor: "#ffc107" }}
                    >
                        🔁 Upscale Again
                    </button>



                    {result.generatedTags?.length > 0 && (
                        <div style={{ marginTop: "1.5rem" }}>
                            <h4 style={styles.subHeading}>Suggested Tags</h4>
                            <div style={styles.suggestionBox}>
                                {result.generatedTags.map((tag, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        style={styles.tagButton}
                                        onClick={(e) => handleTagClick(tag, e)}
                                    >
                                        + {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <a
                        href={`http://localhost:5000/download/${result.enhancedImage.split("/").pop()}`}
                        style={styles.downloadButton}
                    >
                        ⬇️ Download Enhanced Image
                    </a>

                    <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", justifyContent: "center" }}>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            style={{ ...styles.button, backgroundColor: "#17a2b8" }}
                        >
                            ✅ Confirm
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(step - 1)} // sadece bir adım geri
                            style={{ ...styles.button, backgroundColor: "#6c757d" }}
                        >
                            🔙 Back
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && result && (
                <div style={styles.resultPanel}>
                    <h2 style={styles.heading}>Product Confirmed</h2>
                    <p><strong>Name:</strong> {result.name}</p>
                    <p><strong>Category:</strong> {result.category}</p>
                    <img
                        src={`http://localhost:5000${result.enhancedImage}`}
                        alt="Final Enhanced"
                        style={styles.resultImage}
                    />
                    <p style={{ marginTop: "1rem" }}><strong>Tags:</strong></p>
                    <div style={styles.suggestionBox}>
                        {tags.map((tag, i) => (
                            <div key={i} style={styles.tagItem}>{tag}</div>
                        ))}
                    </div>
                    <div style={{ marginTop: "2rem", display: "flex", justifyContent: "center" }}>
                        <button
                            type="button"
                            onClick={() => setStep(step - 1)} // sadece bir adım geri
                            style={{ ...styles.button, backgroundColor: "#6c757d" }}
                        >
                            🔙 Back
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem",
        fontFamily: "Segoe UI, sans-serif",
        backgroundColor: "#f0f2f5",
        minHeight: "100vh"
    },
    leftPanel: {
        width: "100%",
        maxWidth: "600px",
        backgroundColor: "#fff",
        padding: "2rem",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    },
    resultPanel: {
        maxWidth: "700px",
        width: "100%",
        padding: "2rem",
        borderRadius: "12px",
        backgroundColor: "#ffffff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        textAlign: "center",
        marginTop: "2rem",
    },
    heading: {
        fontSize: "1.8rem",
        fontWeight: "bold",
        color: "#333",
        marginBottom: "1rem",
    },
    subHeading: {
        fontSize: "1.2rem",
        color: "#555",
        marginBottom: "0.5rem",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
    },
    input: {
        padding: "0.9rem",
        borderRadius: "8px",
        border: "1px solid #ccc",
        fontSize: "1rem",
    },
    uploadBox: {
        width: "100%",
        maxHeight: "300px",
        overflow: "hidden",
        border: "2px dashed #ccc",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        backgroundColor: "#f9f9f9",
        padding: "1rem",
    },
    resultImage: {
        maxWidth: "100%",
        maxHeight: "300px",
        objectFit: "contain",
        borderRadius: "8px",
        border: "1px solid #ddd",
        marginTop: "1rem",
    },
    button: {
        padding: "1rem",
        backgroundColor: "#007bff",
        color: "white",
        fontWeight: "bold",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "1rem",
        transition: "background-color 0.3s ease",
    },
    suggestionBox: {
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5rem",
        marginTop: "0.5rem",
        justifyContent: "center",
    },
    tagButton: {
        padding: "0.5rem 0.9rem",
        border: "1px solid #ccc",
        borderRadius: "20px",
        backgroundColor: "#e0f7fa",
        cursor: "pointer",
        transition: "all 0.3s ease",
    },
    tagItem: {
        padding: "0.5rem 0.9rem",
        border: "1px solid #ccc",
        borderRadius: "20px",
        backgroundColor: "#d1ecf1",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
    },
    removeBtn: {
        marginLeft: "0.3rem",
        cursor: "pointer",
        color: "red",
        fontWeight: "bold",
    },
    downloadButton: {
        display: "inline-block",
        marginTop: "2rem",
        padding: "0.8rem 1.6rem",
        backgroundColor: "#28a745",
        color: "#fff",
        textDecoration: "none",
        borderRadius: "30px",
        fontWeight: "bold",
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        transition: "background-color 0.3s ease",
    },
};

export default ProductForm;
