import axios from "axios";
import nodemailer from "nodemailer";
// import dotenv from "dotenv";

// dotenv.config();

const fullRepo = process.env.GITHUB_REPOSITORY || "unknown/unknown";
const repoName = fullRepo.split("/")[1];
const codespaceUrl = process.env.GH_CODESPACE_URL

async function checkCodespace() {
  try {
    const res = await axios.get(codespaceUrl, {
      maxRedirects: 5,
      headers: {
        Cookie: process.env.GH_COOKIE
      }
    });

    const body = res.data;

    const label = new URL(codespaceUrl).pathname
      .split("/").pop()            
      .replace(/-[a-z0-9]+$/i, "") 
      .replace(/-/g, " ");

    console.log("🔍 Checking Codespace:", label);

    const hasCodespace = new RegExp(`${repoName} \\[Codespaces: ${label}\\]`);
    const hasVSCode = /vscode/;

    if (hasCodespace.test(body) && hasVSCode.test(body)) {
      console.log("✅ Success, Codespace has been reactivated");
    } else {
      console.error("❌ Codespace cannot be reactivated.");
      await sendEmail(repoName, "Failed, Codespace cannot be reactivated");
    }

  } catch (err) {
    console.error("❌ Error request:", err.message);
    await sendEmail(repoName, "Request error: " + err.message);
  }
}

async function sendEmail(repo, reason) {
  let transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  let info = await transporter.sendMail({
    from: {
      name: "GitHub Action Bot",
      address: process.env.EMAIL_USER
    },
    to: "mhmmdhasanz@gmail.com",
    subject: `[${repo}] Action failed`,
    text: `Repository ${repo}\nReason: ${reason}`
  });

  console.log("📧 Email sent:", info.messageId);
}

checkCodespace();
