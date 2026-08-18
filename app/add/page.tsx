"use client";

import { useState } from "react";

export default function AddProfile() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    gender: "M",
    city: "",
    mother_tongue: "",
    visa_status: "",
    education: "",
    profession: "",
    about: "",
    wants: "",
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        setMessage("Profile added successfully!");
        setForm({
          full_name: "",
          gender: "M",
          city: "",
          mother_tongue: "",
          visa_status: "",
          education: "",
          profession: "",
          about: "",
          wants: "",
        });
      } else {
        setMessage("Error: " + (data.error || "Something went wrong"));
      }
    } catch (err) {
      setMessage("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] py-10 px-5">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-serif mb-2">Add Profile</h1>
        <p className="text-gray-500 mb-8 text-sm">
          Add your profile or a friend’s profile
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm mb-1">Full Name</label>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Gender</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full p-3 border border-gray-200 rounded-xl"
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">City</label>
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              className="w-full p-3 border border-gray-200 rounded-xl"
              placeholder="e.g. Austin, Dallas, Hyderabad"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Mother Tongue</label>
            <input
              name="mother_tongue"
              value={form.mother_tongue}
              onChange={handleChange}
              className="w-full p-3 border border-gray-200 rounded-xl"
              placeholder="e.g. Telugu, Tamil, Hindi"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Visa Status</label>
            <select
              name="visa_status"
              value={form.visa_status}
              onChange={handleChange}
              className="w-full p-3 border border-gray-200 rounded-xl"
            >
              <option value="">Select</option>
              <option value="Citizen">Citizen</option>
              <option value="Green card">Green card</option>
              <option value="H1B">H1B</option>
              <option value="In India">In India</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Education</label>
            <input
              name="education"
              value={form.education}
              onChange={handleChange}
              className="w-full p-3 border border-gray-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Profession</label>
            <input
              name="profession"
              value={form.profession}
              onChange={handleChange}
              className="w-full p-3 border border-gray-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">About</label>
            <textarea
              name="about"
              value={form.about}
              onChange={handleChange}
              rows={3}
              className="w-full p-3 border border-gray-200 rounded-xl"
              placeholder="A short paragraph about the person"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">What they are looking for</label>
            <textarea
              name="wants"
              value={form.wants}
              onChange={handleChange}
              rows={3}
              className="w-full p-3 border border-gray-200 rounded-xl"
              placeholder="What kind of partner they want"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3.5 rounded-full font-medium"
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>

          {message && (
            <p className="text-center text-sm mt-4">
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}