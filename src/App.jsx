import { useState, useEffect, useRef } from "react";
import Webcam from "react-webcam";
import { FaCamera } from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { initializeApp } from "firebase/app";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import emailjs from "emailjs-com";

export default function App() {
  const [description, setDescription] = useState("");
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loclatitude, setLatitude] = useState("");
  const [loclongitude, setlongitude] = useState("");
  const [address, setAddress] = useState(null);
  const videoRef = useRef();

  const handleSubmit = async () => {
    setLoading(true);

    // Konfigurasi Firebase
    const firebaseConfig = {
      apiKey: "AIzaSyCED-mC5kxoZRv9BHerkWbZo_cwtxJmCOU",
      authDomain: "sehatmurnisejahtera-fd9d2.firebaseapp.com",
      projectId: "sehatmurnisejahtera-fd9d2",
      storageBucket: "sehatmurnisejahtera-fd9d2.appspot.com",
      messagingSenderId: "278921260940",
      appId: "1:278921260940:web:e56e46846de17e2e8a30a9",
    };

    const firebaseApp = initializeApp(firebaseConfig);
    const storage = getStorage(firebaseApp);

    try {
      // 1. Upload foto
      if (!capturedPhoto) {
        setLoading(false);
        toast.error("Please take a photo before submitting");
        throw new Error("Please take a photo before submitting");
      }
      const blob = await fetch(capturedPhoto).then((res) => res.blob());
      const photoFileName = `dhira/photo_${Date.now()}.jpg`;

      const photoStorageRef = ref(storage, photoFileName);
      const photoUploadTask = uploadBytes(photoStorageRef, blob);

      // Dapatkan URL unduhan setelah unggah selesai
      const photoDownloadURL = await photoUploadTask.then((snapshot) => {
        return getDownloadURL(photoStorageRef);
      });

      if (address && loclatitude && loclongitude) {
        // 3. Kirim data menggunakan Axios
        const templateParams = {
          name: "dhira",
          email: "dhira",
          message: description,
          photo_url: photoDownloadURL,
          location: address,
        };

        emailjs
          .send(
            "service_ujhnczt", // Replace with your EmailJS service ID
            "template_83rmp6a", // Replace with your EmailJS template ID
            templateParams,
            "GNOv0hdkFXi2COdlS" // Replace with your EmailJS user ID
          )
          .then(
            (response) => {
              console.log("SUCCESS!", response.status, response.text);
              toast.success("Thank you for sharing!");
              setLoading(false);
              setDescription("");
              setCapturedPhoto("");
              setAddress("");
            },
            (error) => {
              console.log("FAILED...", error);
              toast.error("Failed to send Photo.");
              setLoading(false);
            }
          );
        // const response = await axios.post();

        // if (response.status === 200) {
        //   toast.success(response.data.message);
        //   setLoading(false);
        // }
      } else {
        toast.error("Please Signature before submitting");
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response.data.message);
      setLoading(false);
    }
  };

  const toggleLocation = () => {
    enableGeolocation();
  };

  const enableGps = async (latitude, longitude) => {
    try {
      const apiKey = "39c16ccc43b54fb697f38ab5adbcfe4e";
      const apiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`;
      const axiosResponse = await axios.get(apiUrl);
      const data = axiosResponse.data;

      if (data.results.length > 0) {
        const formattedAddress = data.results[0].formatted;
        setAddress(formattedAddress);
      }
    } catch (error) {
      console.error("Error akses GPS:", error.message);
    }
  };

  const takePhoto = () => {
    const dataURL = videoRef.current.getScreenshot();
    setCapturedPhoto(dataURL);
  };
  const enableGeolocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          setLatitude(latitude);
          setlongitude(longitude);
          enableGps(latitude, longitude);
        },
        (error) => {
          toast.error("Tidak dapat mengakses lokasi:", error.message);
          console.error("Tidak dapat mengakses lokasi:", error.message);
        }
      );
    } else {
      toast.error("Browser tidak mendukung Geolocation ");
      console.error("Browser tidak mendukung Geolocation API");
    }
  };
  useEffect(() => {
    enableGeolocation();
    setIsCameraActive(true);
  }, []);

  return (
    <div className="flex flex-col gap-4 bg-white min-h-screen w-full p-10">
      <div>
        <h1 className="text-3xl pb-5 text-center font-medium">
          Hello Dhira, Capture Your Best Shot!
        </h1>
      </div>

      <div className="flex flex-col overflow-x-hidden bg-slate-200 gap-4 md:px-4 px-2 w-full">
        <div className="">
          {/* Loading indicator saat kamera aktif */}
          {!isCameraActive && (
            <div className="mb-4 text-center">
              <ClipLoader size={35} color={"#db2777"} />
            </div>
          )}

          {/* Tampilkan video kamera */}
          {isCameraActive && !capturedPhoto && (
            <div className="flex flex-col justify-center items-center gap-3">
              <div className="bg-lightPrimary  rounded-3xl border border-pink-500 p-3">
                <Webcam
                  ref={videoRef}
                  audio={false}
                  mirrored={true}
                  screenshotFormat="image/jpeg"
                  className="w-full h-auto max-w-3xl rounded-3xl"
                />
              </div>

              <button
                className="h-50 text-center bg-pink-500 hover:bg-pink-800  p-4 rounded-full"
                onClick={takePhoto}
              >
                <FaCamera className="text-lightPrimary text-2xl " />
              </button>
            </div>
          )}

          {/* Tampilkan foto yang diambil */}
          {capturedPhoto && (
            <div className="flex flex-col justify-center items-center">
              <div className="bg-lightPrimary rounded-3xl border border-pink-500 p-3">
                <img
                  src={capturedPhoto}
                  alt="Captured"
                  className="w-full h-auto max-w-3xl md:max-w-none rounded-3xl"
                />
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-3">
          <label
            htmlFor="description"
            className="block mb-2 text-xl font-medium text-black"
          >
            Would you like to leave a message for Rhazes?
          </label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter your message here"
            className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  dark:focus:ring-blue-500 dark:focus:border-blue-500"
          />
        </div>

        {/* Location */}
        <div className="mb-3">
          <label
            htmlFor="location"
            className="block mb-2 text-xl font-medium text-black"
          >
            Location
          </label>
          {!address ? (
            <div className="mb-4 ">
              <ClipLoader size={20} color={"#db2777"} />
            </div>
          ) : (
            <p className="text-pink-500">{address}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="w-full flex justify-end">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="text-white bg-pink-500 hover:bg-pink-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center "
          >
            {loading ? <ClipLoader size={10} color={"#fff"} /> : "Submit"}
          </button>
        </div>
        {/* Warning */}
        <div className="w-full">
          <h1 className="text-md font-medium mb-3">Note:</h1>
          <p className="text-sm">
            <span>
              - If Camera is not active, please{" "}
              <button
                onClick={() => {
                  setIsCameraActive(true);
                  setCapturedPhoto(false);
                }}
                className="text-pink-500"
              >
                click here
              </button>
              .
            </span>
          </p>
          <p className="text-sm">
            <span>
              - If Location is not active. Please{" "}
              <button onClick={toggleLocation} className="text-pink-500">
                click here
              </button>
              .
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
