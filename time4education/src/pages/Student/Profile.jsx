// src/pages/Student/Profile.jsx
import React, { useEffect, useState } from "react";
import axios from "@/api/axios";
import { useAuth } from "@/context/AuthContext";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // const res = await axios.get("/auth/me");
        setProfile(user);
      } catch (err) {
        setErrorMsg(err.response?.data?.message || "Error fetching profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        Loading profile...
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex justify-center items-center h-64 text-red-600">
        {errorMsg}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white shadow rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-xl">
          {profile?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
          <p className="text-gray-500 text-sm">{profile.email}</p>
        </div>
      </div>

      <div className="border-t pt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Roll Number:</span>
          <span className="font-medium">{profile.rollNo}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">College:</span>
          <span className="font-medium">{profile.college}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Batch:</span>
          <span className="font-medium">{profile.batch}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Department:</span>
          <span className="font-medium">{profile.department}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Role:</span>
          <span className="font-medium capitalize">{profile.role}</span>
        </div>
      </div>
    </div>
  );
};

export default Profile;
