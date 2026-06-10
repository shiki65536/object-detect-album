# Object Detect Album

**Live Demo:** https://d3vz5yv0yzzzcd.cloudfront.net/

A cloud-native photo album that automatically detects objects in uploaded images using YOLO object detection and enables searching by image content instead of manually organising photos.

![framework](https://i.imgur.com/8ah2M8c.png)

## Overview

Object Detect Album allows users to:

- Sign up and authenticate with Email or Google OAuth
- Upload personal images securely
- Automatically generate object tags using YOLOv3-Tiny
- Edit or manage generated tags
- Search images by tags
- Search similar images using another image

The application demonstrates an event-driven serverless architecture on AWS.

## Architecture

### Frontend

- React
- TypeScript
- Ant Design
- CloudFront + S3 Static Hosting

### Backend

- API Gateway
- AWS Lambda (Node.js)
- AWS Lambda Container Image (Python + OpenCV + YOLOv3-Tiny)
- Amazon DynamoDB
- Amazon S3
- Amazon Cognito

### Authentication

- Email / Password Login
- Google OAuth Login
- JWT Authorization via Cognito User Pool

## Workflow

### Image Upload

1. User uploads an image
2. Image is stored in Amazon S3
3. S3 event triggers Object Detection Lambda
4. YOLO detects objects inside the image
5. Tags are stored in DynamoDB
6. Frontend automatically refreshes and displays results

### Image Search

1. User uploads a query image
2. Object Detection Lambda extracts tags
3. Search Lambda compares detected tags against stored images
4. Matching images are returned

## Features

### Automatic Object Detection

Detects common objects using YOLOv3-Tiny running inside a Lambda Container Image.

Examples:

- person
- dog
- cat
- car
- bottle
- cup
- chair

### Tag Management

Users can:

- Edit tags
- Adjust tag counts
- Add custom tags
- Delete tags

### Search by Tag

Example:

person:1,dog:1

Returns images containing at least one person and one dog.

### Search by Image

Upload an image and retrieve visually similar photos based on detected object composition.

## AWS Services Used

- Amazon S3
- Amazon CloudFront
- Amazon Cognito
- AWS Lambda
- AWS Lambda Container Images
- Amazon DynamoDB
- Amazon API Gateway
- Amazon ECR
- CloudWatch

## Key Engineering Challenges

- Migrating legacy Lambda Layers to Lambda Container Images for YOLO deployment
- Integrating Cognito User Pools with Google OAuth
- Handling CORS across CloudFront, API Gateway and Cognito
- Managing large OpenCV dependencies within Lambda runtime limits
- Building an event-driven image processing pipeline

## Future Improvements

- Semantic image search using CLIP embeddings
- Face clustering and person recognition
- Bulk image upload
- Pagination and lazy loading
- Mobile-friendly UI
- Infrastructure as Code refinements
