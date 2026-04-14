import axios from "axios";

const upload = async (file) => {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", "freelancePlatform");

  try {
    const res = await axios.post("https://api.cloudinary.com/v1_1/dwdzdgpwf/image/upload", data);
    return res.data.secure_url;
  } catch (err) {
    console.error("Cloudinary Upload Error:", err);
    return "";
  }
};

export default upload;
