const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const upload = require('./upload');
const Token = require('../../models/token');
const sendEmail = require('../../utils/sendEmail');
const crypto = require('crypto')
const fs = require('fs');
const pdfParse = require('pdf-parse');
const tesseract = require("node-tesseract-ocr");
const path = require('path');
const FormData = require('form-data');
const axios = require("axios");
const dotenv = require('dotenv')
const result = dotenv.config({path: path.resolve(__dirname, '../../.env')});

const OPEN_API_KEY = process.env.OPENAI_API_KEY;

const model = "whisper-1";

let text = "";

const config = {
    lang: "eng",
    oem: 1,
    psm: 3,
}


// Load input validation
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");


// Load User model
const User = require("../../models/UserSchema");

// Extract Data from PDF
const extract_data_pdf = async (name) =>{
    
    const getPDF = async (file) => {
        let readFileSync = fs.readFileSync(file)
        try {
          let pdfExtract = await pdfParse(readFileSync)
          text = pdfExtract.text + text;
        } catch (error) {
          throw new Error(error)
        }
      }
      const pdfPath = path.join(__dirname, "../../uploads/", name);
      await getPDF(pdfPath)
}

// Extract Data from Img
const extract_data_img = async (name) => {

    const filePath = path.join(__dirname, "../../uploads", name);
    
    const txt = await tesseract.recognize(filePath, config)
    
    text += txt
}

// Extract Data from Audio
const extract_data_audio = async (name) => {
    const filePath = path.join(__dirname, "../../uploads/" + name);

    const formData = new FormData();
    formData.append("model", model);
    formData.append("file", fs.createReadStream(filePath));

    const txt = await axios
        .post("https://api.openai.com/v1/audio/transcriptions", formData, {
            headers: {
                Authorization: `Bearer ${OPEN_API_KEY}`,
                "Content-Type": `multipart/form-data;boundary = ${formData._boundary}`
            },
        })
    text += txt.data.text
}
// @route POST api/users/register
// @desc Register user
// @access Public

router.post("/register", async (req, res) => {
	try {
		// Form validation
        const {errors, isValid} = validateRegisterInput(req.body);
        
        if(!isValid){
            return res.status(400).json(errors);
        }
		let user = await User.findOne({ email: req.body.email });
		if (user)
			return res
				.status(409)
				.send({ message: "User with given email already Exist!" });

		const salt = await bcrypt.genSalt(Number(process.env.SALT));
		const hashPassword = await bcrypt.hash(req.body.password, salt);

		user = await new User({ ...req.body, password: hashPassword }).save();

		const token = await new Token({
			userId: user._id,
			token: crypto.randomBytes(32).toString("hex"),
		}).save();
		const url = `${process.env.BASE_URL}users/${user.id}/verify/${token.token}`;
		await sendEmail(user.email, "Verify Email", url);

		res
			.status(201)
			.send({ message: "An Email sent to your account please verify" });
	} catch (error) {
		console.log(error);
		res.status(500).send({ message: "Internal Server Error" });
	}
});

// @route POST api/users/login
// @desc Login user and return JWT token
// @access Public

router.post("/login",(req,res) => {

    //Form Valdiation
    const {errors, isValid} = validateLoginInput(req.body);

    if (!isValid) {
        return res.status(400).json(errors);
    }

    const email = req.body.email;
    const password = req.body.password;
   
    //Find user by Email
    User.findOne({email}).then(user=>{
        if(!user){
            return res.status(404).json({ emailnotfound: "Email not found" });
        }

    // Check password
    bcrypt.compare(password, user.password).then(isMatch => {
        if (isMatch) {
            // Create JWT Payload
            const payload = {
                id: user.id,
                name: user.name
            };

            // Sign token
            jwt.sign(
                payload,
                keys.secretOrKey,
                {
                 expiresIn: 31556926 
                },
                (err, token) => {
                res.json({
                    success: true,
                    token: "Bearer " + token
                });
                }
            );
        } else {
          return res
            .status(400)
            .json({ passwordincorrect: "Password incorrect" });
        }
      });
    });
});

// @route POST api/upload_file
// @desc Save Uploaded the file
// @access Public
router.post("/upload_file", upload.array('files'), async (req,res) => {
    if(!req.files) {
        throw Error("File Missing")
    } else{
        //Check the File type == PDF
        if(req.files[0].mimetype === 'application/pdf'){
            for (let i = 0; i < req.files.length ; i += 1){
                await extract_data_pdf(req.files[i].filename);
            }
            res.send({status: "success", result: text})
        }
        //File TYPE == Image'
        if(req.files[0].mimetype.includes('image')){
            for (let i = 0; i < req.files.length; i += 1){
                await extract_data_img(req.files[i].filename);
            }
            res.send({status: "success", result: text})
        }
        //FILE TYPE == Audio
        if(req.files[0].mimetype.includes('audio')){
            for (let i = 0; i < req.files.length; i += 1){
                await extract_data_audio(req.files[i].filename);
            }
            res.send({status: "success", result: text})
        }
    }
})

//@route GET api/:id/verify/:token/
//@desc send verify code
//@access Public
router.get("/:id/verify/:token/", async (req, res) => {
	try {
		const user = await User.findOne({ _id: req.params.id });
		if (!user) return res.status(400).send({ message: "Invalid link" });

		const token = await Token.findOne({
			userId: user._id,
			token: req.params.token,
		});
		if (!token) return res.status(400).send({ message: "Invalid link" });

		await User.updateOne({ _id: user._id, verified: true });
		await token.remove();

		res.status(200).send({ message: "Email verified successfully" });
	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" });
	}
});


module.exports = router;