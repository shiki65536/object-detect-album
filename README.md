🖼️ object detect album
![framework](https://i.imgur.com/8ah2M8c.png)
![app](https://shiki65536.github.io/img/posts/object-detect.gif))

Upload your photo and the system will automatically detect the object.

## SYSTEM ARCHITECTURE

The system is composed of several key components - Lambda, AWS Cognito, Amazon DynamoDB, API Gateway, and S3 - that collaboratively work to deliver the desired functionality.

## WEBSITE

After registration, login with your new account to access the system's features. To sign out, click on the profile at the upper right and select Logout.
Note that without logging in, you cannot access the homepage or use any system functions.

Once logged in, you will be directed to the home page. This page displays all the images you have uploaded along with their corresponding tags.

## UPLOAD FUNCTION

To upload an image, simply click on the designated button. It's important to note that the system only supports the upload of one image at a time.

## EDIT FUNCTION

If you wish to modify the tag description of an image, click on the respective tag. This will allow you to edit the tag and count according to your preference.

## DELETE FUNCTION

When you decide to remove an image from the system, simply click on the delete link. This action will prompt the deletion process.

## SEARCH BY TAG FUNCTION

To search for images with similar tags, enter a specific tag followed by a count in the format "tag:count" in the search field. The system will retrieve and display all relevant images.

## SEARCH BY IMAGE FUNCTION

For a more advanced search capability, you can upload an image to find similar images within the system.
This feature utilises image recognition technology to provide accurate results.
