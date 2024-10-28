const FileTemplate = function (name: string, url: string, filename: string) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #F3F3F3;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        table {
            width: 100%;
            background-color: #FFFFFF;
            max-width: 600px;
            margin: 0 auto;
            border-collapse: collapse;
        }
        .header {
            padding: 50px 0 30px 40px;
        }
        .header img {
            width: 80px;
            height: auto;
        }
        .welcome {
            font-size: 36px;
            font-weight: 700;
            text-align: center;
            color: #140A38;
        }
        .download-button {
            text-align: center;
            padding: 10px 0;
        }
        .download-button a {
            background-color: #AD54F2;
            color: #fff;
            text-decoration: none;
            padding: 13px 30px;
            display: inline-block;
            font-size: 18px;
            text-transform: capitalize;
            margin-bottom: 60px;
        }
        .content {
            padding: 0 40px 30px 40px;
            text-align: left;
        }
        .content h3 {
            padding-top: 30px;
            margin-top: 30px;
            border-top: 1px solid #F2EEFE;
        }
        .content p {
            margin: 5px 0;
            line-height: 1.5;
        }
        .file-info {
            padding: 40px 30px;
            border-top: 1px solid #AD54F2;
            box-shadow: 0px 12px 80px 0px rgba(151, 71, 255, 0.14);
        }
        .file-info table {
            width: 100%;
        }
        .file-info td {
            padding: 5px 0;
        }
        .file-info td:last-child {
            border-bottom: none;
        }
        .contact-info {
            padding: 30px 40px;
            text-align: center;
        }
        .contact-info a {
            color: #6C3CD8;
            text-decoration: none;
        }
        .footer {
            padding: 0px 40px;
            text-align: center;
            color: #8C8C8C;
            font-size: 12px;
        }
        .footer a {
            margin: 0 10px;
            text-decoration: none;
            color: #8C8C8C;
        }
    </style>
</head>
<body>
    <table>
        <tr>
            <td class="header">
                <img style="width: 240px;" src="https://storage.googleapis.com/msgsndr/eqHvKvCoOWjbs8Sb71D1/media/6718ce28142c9f1cefc3726b.png" alt="template STUDIO" />
            </td>
        </tr>
        <tr>
            <td class="welcome">
                Welcome to template studio
            </td>
        </tr>
        <tr>
            <td class="download-button">
                <a href="${url}" download="${filename}">Download Template</a>
            </td>
        </tr>
        <tr>
            <td class="content">
                <h3 style="font-size: 20px; font-weight: 600; line-height: 28px; color: #110833;"><span style="color: #5D5775;">Dear -</span>${name}</h3>
                <p style="font-size: 20px; font-weight: 400; line-height: 28px; color: #110833; padding: 20px 0 40px 0;">
                    I hope this email finds you well. We are pleased to provide you with the download link for the file you requested. Please click the link below to start the download.
                </p>
                <div class="file-info">
                    <table>
                        <tr>
                            <td style="font-size: 18px; font-weight: 400; line-height: 28px; color: #544E4E;">File Name</td>
                            <td style="text-align: right; width: 245px; color: #110833; font-size: 16px; font-weight: 600; line-height: 24px;">${filename}</td>
                        </tr>
                        <tr>
                            <td style="font-size: 18px; font-weight: 400; line-height: 28px; color: #544E4E;">File Size</td>
                            <td style="text-align: right; width: 245px; color: #110833; font-size: 16px; font-weight: 600; line-height: 24px;">24 MB</td>
                        </tr>
                        <tr>
                            <td style="font-size: 18px; font-weight: 400; line-height: 28px; color: #544E4E;">File Format</td>
                            <td style="text-align: right; width: 245px; color: #110833; font-size: 16px; font-weight: 600; line-height: 24px;">
                                <img src="https://storage.googleapis.com/msgsndr/eqHvKvCoOWjbs8Sb71D1/media/6718e7ed3b2a8388001f11ba.png" alt="figma"> Figma
                            </td>
                        </tr>
                    </table>
                </div>
            </td>
        </tr>
        <tr>
            <td class="footer">
                <p style="color: #110833; font-size: 20px; font-weight: 400; line-height: 28px; padding: 20px; background-color: #FAFAFA;">
                    Thank you for choosing <span style="color: #AD54F2; font-weight: 700;">template STUDIO</span> for your file download needs. We appreciate your trust in our services.
                </p>
                <p style="display: inline-block; padding: 13px 30px; text-align: center; color: #AD54F2; font-size: 18px; font-weight: 600; line-height: 24px; text-transform: capitalize; margin: 40px 0 30px 0; border: 1px solid #AD54F2;">
                    Download Template
                </p>
            </td>
        </tr>
        <td style="padding: 30px 0">
            <p style="padding: 30px 40px; text-align: center; margin: 0 auto; border-top: 1px solid #F2EEFE;">
                <a href="#"><img src="https://storage.googleapis.com/msgsndr/eqHvKvCoOWjbs8Sb71D1/media/6718ce28142c9f76d8c3726c.png" alt="twitter" /></a>
                <a style="margin: 0 25px;" href="#"><img src="https://storage.googleapis.com/msgsndr/eqHvKvCoOWjbs8Sb71D1/media/6718ce280ca4c643f5c40511.png" alt="Behance" /></a>
                <a href="#"><img src="https://storage.googleapis.com/msgsndr/eqHvKvCoOWjbs8Sb71D1/media/6718ce28843dc32469eaffd3.png" alt="linkedin" /></a>
                <a style="margin: 0 25px;" href="#"><img src="https://storage.googleapis.com/msgsndr/eqHvKvCoOWjbs8Sb71D1/media/6718ce280ca4c6caa0c40510.png" alt="Instagram" /></a>
                <a href="#"><img src="https://storage.googleapis.com/msgsndr/eqHvKvCoOWjbs8Sb71D1/media/6718ce28623022d91951c6e6.png" alt="globe" /></a>
            </p>
            <p style="font-size: 16px; font-weight: 400; line-height: 24px; color: #110833; text-align: center;">Stay in touch with template studio</p>
            <p style="text-align: center; padding-top: 20px;">
                <span style="color: #AD54F2;">&copy;2023 template STUDIO. All rights reserved.</span>
            </p>
        </td>
        </tr>
    </table>
</body>
</html>
`;

    return {
        subject: 'Download Template',
        html: html,
    };
};

export default FileTemplate