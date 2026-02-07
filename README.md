🛍️ AI-Powered E-Commerce Image Enhancement & Tag Suggestion System
1. Project Overview

This project is an AI-assisted e-commerce content enhancement system that improves product images and automatically generates semantic product tags using deep learning models.

The system combines computer vision, super-resolution, and vision-language AI models to enhance user-uploaded product images and improve product discoverability in online marketplaces.

This project was developed as a graduation thesis titled:

👉 "Image Resolution Enhancement and Automated Tagging for E-Commerce Platforms"
[Bitirme Tezi - Ahmet AKYIL.pdf](https://github.com/user-attachments/files/25151442/Bitirme.Tezi.-.Ahmet.AKYIL.pdf)

2. Key Features
2.1 Hybrid AI Image Enhancement

Uses Real-ESRGAN for super-resolution

Applies fine-tuned models for detected product regions

Uses default enhancement for background areas

Uses feather blending to produce natural results


2.2 Object-Aware Tag Suggestion

Uses YOLO for object detection

Uses CLIP for semantic tag generation

Category-based tag filtering

Zero-shot classification support

2.3 Dynamic Tag Learning

Learns from user-added tags

Frequently used tags are promoted automatically


3.Hybrid Enhancement Example


<img width="599" height="203" alt="image" src="https://github.com/user-attachments/assets/036a562c-7f22-4508-af5e-418771408c3b" />
<img width="591" height="271" alt="image" src="https://github.com/user-attachments/assets/6d26683c-3bcb-48cc-8cd8-37e9b7121ae5" />


4. Application Interface

<img width="584" height="626" alt="image" src="https://github.com/user-attachments/assets/9339782a-c8d7-4a64-938d-979ff249500c" />
<img width="585" height="641" alt="image" src="https://github.com/user-attachments/assets/90b111ab-0b47-47f5-a55d-050aaa53d21f" />

5.Technologies Used
Backend

Flask

Python

PyTorch

Real-ESRGAN

YOLO (Ultralytics)

CLIP

PIL / Image Processing

Frontend

React

JavaScript

CSS

REST API Integration
