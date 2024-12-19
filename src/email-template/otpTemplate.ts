const Otptemplate = (email: string, otp: string) => {
    const html = `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
        body {
            font-family: "Open Sans", sans-serif;
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
            padding: 50px 0px 10px 0px;
            text-align: center;
        }
        .header img {
            width: 80px;
            height: auto;
        }
    </style>
</head>
<body>
    <table>
        <tr>
            <td class="header">
                <img style="max-width: 240px; width: 100%;"
                    src="https://storage.googleapis.com/msgsndr/eqHvKvCoOWjbs8Sb71D1/media/6718ce28142c9f1cefc3726b.png"
                    alt="template STUDIO" />
            </td>
        </tr>
        <tr>
            <td>
                <img style="padding: 30px 40px 0 40px ;"
                    src="https://storage.googleapis.com/msgsndr/eqHvKvCoOWjbs8Sb71D1/media/6718ccd228f9aa7ded8a2b39.png"
                    alt="">
            </td>
        <tr>
        </tr>
        </tr>
        <tr>
            <td>
                <div style="
                    margin: 0 auto;
                    margin-top: -140px;
                    background: #FFFFFF;
                    text-align: center;
                    max-width: 520px;
                    width: 100%;
                    position: relative;
                    padding: 30px;
                    z-index: 1;
                    box-shadow: 0px 0px 30px 0px rgba(182, 89, 255, 0.04), 0px 8px 40px 0px rgba(0, 0, 0, 0.06);
    ">
                    <div style="width: 100%; max-width: 489px; margin: 0 auto;">
                        <h1 style="
                            margin: 0;
                            font-size: 16px;
                            font-weight: 400;
                            line-height: 150%;
                            color: #111827;
                            text-align: left;
                            text-transform: capitalize;
        ">
                            One Time password
                        </h1>
                        <p
                            style="padding: 20px;  margin-top: 8px; font-size: 30px; font-weight: 400; line-height: 142%; letter-spacing: 25px; text-align: center; color: #AD54F2;">
                            ${otp}</p>
                        <p style="
                            margin-top: 20px;
                            font-weight: 400;
                            font-size: 16px;
                            line-height: 161%;
                            letter-spacing: 0.56px;
                            color: #4B5563;
                            text-align: left;
        ">
                            Thank you for choosing Template Studio. Use the following OTP
                            to complete the proceed further. OTP is
                            valid for
                            5 minutes.
                            Do not share this code with others.
                        </p>
                    </div>
                </div>
            </td>
        </tr>
        <td style="padding: 30px 0; max-width: 100%;">
            <p style="padding: 30px 40px; text-align: center; margin: 0 auto; border-top: 1px solid #F2EEFE;">
                <a href="#"><img
                        src="https://storage.googleapis.com/msgsndr/eqHvKvCoOWjbs8Sb71D1/media/6718ce28142c9f76d8c3726c.png"
                        alt="twitter" /></a>
                <a style="margin: 0 25px;" href="#"><img
                        src="https://storage.googleapis.com/msgsndr/eqHvKvCoOWjbs8Sb71D1/media/6718ce280ca4c643f5c40511.png"
                        alt="Behance" /></a>
                <a href="#"><img
                        src="https://storage.googleapis.com/msgsndr/eqHvKvCoOWjbs8Sb71D1/media/6718ce28843dc32469eaffd3.png"
                        alt="linkedin" /></a>
                <a style="margin: 0 25px;" href="#"><img
                        src="https://storage.googleapis.com/msgsndr/eqHvKvCoOWjbs8Sb71D1/media/6718ce280ca4c6caa0c40510.png"
                        alt="Instagram" /></a>
                <a href="#"><img
                        src="https://storage.googleapis.com/msgsndr/eqHvKvCoOWjbs8Sb71D1/media/6718ce28623022d91951c6e6.png"
                        alt="globe" /></a>
            </p>
            
            <p
                style="font-size: 16px; font-weight: 400; line-height: 24px; color: #5D5775; text-align: center; font-size: 14px; font-weight: 400; line-height: 140%;">
                Template Studio | © <span id="yeardate"></span> All Rights Reserved</p>
            <p style="text-align: center; padding-top: 16px;">
                <a style="text-decoration: none; color: #5D5775;  font-size: 14px; font-weight: 400; line-height: 140%;"
                    href="#">Licensing</a> <a
                    style="text-decoration: none; color: #5D5775; font-size: 14px; font-weight: 400; line-height: 140%; margin: 0 16px;"
                    href="#">Terms & Conditions</a> <a
                    style="text-decoration: none; color: #5D5775; font-size: 14px; font-weight: 400; line-height: 140%;"
                    href="#">Privacy & Policy</a>
            </p>
        </td>
    </table>
    <script>
        let current_year = new Date().getFullYear();
        document.getElementById("yeardate").textContent = current_year;
    </script>
</body>
</html>
    `;
    return {
        subject: "otp template",
        html: html
    }
}

export default Otptemplate