# 🛍️ AI-Powered E-Commerce Image Enhancement & Tag Suggestion System

---

## 1. Project Overview

This project is an **AI-assisted e-commerce content enhancement system** that improves product images and automatically generates semantic product tags using deep learning models.

The system combines:

- Computer vision  
- Super-resolution  
- Vision-language AI models  

It enhances user-uploaded product images and improves product discoverability in online marketplaces.

This project was developed as a graduation thesis titled:

> **Image Resolution Enhancement and Automated Tagging for E-Commerce Platforms**

📄 Thesis Document:  
[Bitirme Tezi - Ahmet AKYIL.pdf](https://github.com/user-attachments/files/25151442/Bitirme.Tezi.-.Ahmet.AKYIL.pdf)

---

## 2. Key Features

### 2.1 Hybrid AI Image Enhancement

The system applies a hybrid super-resolution pipeline:

- Uses **Real-ESRGAN** for super-resolution  
- Applies **fine-tuned models** for detected product regions  
- Uses **default enhancement** for background areas  
- Uses **feather blending** to produce natural visual results  

---

### 2.2 Object-Aware Tag Suggestion

The tagging system combines object detection and semantic classification:

- Uses **YOLO** for object detection  
- Uses **CLIP** for semantic tag generation  
- Supports **category-based tag filtering**  
- Supports **zero-shot classification**  

---

### 2.3 Dynamic Tag Learning

The system supports adaptive tagging behavior:

- Learns from **user-added tags**  
- Frequently used tags are **promoted automatically**

---

## 3. Hybrid Enhancement Example

<p align="center">
  <img src="https://github.com/user-attachments/assets/036a562c-7f22-4508-af5e-418771408c3b" width="45%" />
  <img src="https://github.com/user-attachments/assets/6d26683c-3bcb-48cc-8cd8-37e9b7121ae5" width="45%" />
</p>

---

## 4. Application Interface

<p align="center">
  <img src="https://github.com/user-attachments/assets/9339782a-c8d7-4a64-938d-979ff249500c" width="45%" />
  <img src="https://github.com/user-attachments/assets/90b111ab-0b47-47f5-a55d-050aaa53d21f" width="45%" />
</p>

---

## 5. Technologies Used

### Backend

- Flask  
- Python  
- PyTorch  
- Real-ESRGAN  
- YOLO (Ultralytics)  
- CLIP  
- PIL / Image Processing  

---

### Frontend

- React  
- JavaScript  
- CSS  
- REST API Integration  

---

## 6. Demo Tag Configuration Notice

The tag suggestion configuration in this repository is prepared for **demonstration purposes**.

In a production environment, the tagging system is designed to work with:

- Large-scale e-commerce databases  
- Dynamic category structures  

---
