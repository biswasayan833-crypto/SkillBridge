import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import userService from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

const StudentProfilePage = () => {
  const { user: authUser, refreshUser } = useAuth();

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    college: '',
    degree: '',
    graduationYear: '',
    bio: '',
    skills: '',
    github: '',
    linkedin: '',
    resume: { url: '', filename: '', uploadedAt: null },
  });

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [deletingResume, setDeletingResume] = useState(false);

  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Fetch initial profile
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await userService.getProfile();
      if (res.success && res.user) {
        const u = res.user;
        setProfile({
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          location: u.location || '',
          college: u.college || '',
          degree: u.degree || '',
          graduationYear: u.graduationYear ? String(u.graduationYear) : '',
          bio: u.bio || '',
          skills: Array.isArray(u.skills) ? u.skills.join(', ') : '',
          github: u.github || '',
          linkedin: u.linkedin || '',
          resume: u.resume || { url: '', filename: '', uploadedAt: null },
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'danger',
        text: err.message || 'Failed to load profile. Please refresh.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setStatusMessage({ type: '', text: '' });

    try {
      // Split skills by commas and trim
      const skillsArray = profile.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        location: profile.location.trim(),
        college: profile.college.trim(),
        degree: profile.degree.trim(),
        graduationYear: profile.graduationYear ? Number(profile.graduationYear) : null,
        bio: profile.bio.trim(),
        skills: skillsArray,
        github: profile.github.trim(),
        linkedin: profile.linkedin.trim(),
      };

      const res = await userService.updateProfile(payload);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: 'Profile updated successfully!',
        });
        // Update user state in AuthContext if name changed
        if (refreshUser) {
          await refreshUser();
        }
      }
    } catch (err) {
      setStatusMessage({
        type: 'danger',
        text: err.message || 'Failed to update profile.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Client-side validations
    const allowedExtensions = ['.pdf', '.docx'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setStatusMessage({
        type: 'danger',
        text: 'Only PDF (.pdf) and Word (.docx) files are supported.',
      });
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({
        type: 'danger',
        text: 'File size exceeds 5 MB. Please select a smaller document.',
      });
      e.target.value = '';
      return;
    }

    setStatusMessage({ type: '', text: '' });
    setSelectedFile(file);
  };

  const handleUploadResume = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setStatusMessage({
        type: 'danger',
        text: 'Please select a PDF or DOCX file to upload.',
      });
      return;
    }

    setUploadingResume(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);

      const res = await userService.uploadResume(formData);
      if (res.success && res.resume) {
        setProfile((prev) => ({
          ...prev,
          resume: res.resume,
        }));
        setSelectedFile(null);
        // Clear file input
        const fileInput = document.getElementById('resume-file-input');
        if (fileInput) fileInput.value = '';

        setStatusMessage({
          type: 'success',
          text: 'Resume uploaded successfully!',
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'danger',
        text: err.message || 'Failed to upload resume.',
      });
    } finally {
      setUploadingResume(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!window.confirm('Are you sure you want to remove your resume?')) {
      return;
    }

    setDeletingResume(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const res = await userService.deleteResume();
      if (res.success) {
        setProfile((prev) => ({
          ...prev,
          resume: { url: '', filename: '', uploadedAt: null },
        }));
        setStatusMessage({
          type: 'success',
          text: 'Resume removed successfully.',
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'danger',
        text: err.message || 'Failed to delete resume.',
      });
    } finally {
      setDeletingResume(false);
    }
  };

  const handleDownloadResume = async () => {
    try {
      const blob = await userService.getResume();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = profile.resume.filename || 'resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setStatusMessage({
        type: 'danger',
        text: err.message || 'Could not download resume file.',
      });
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '850px', margin: '3rem auto', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading profile information...</p>
      </div>
    );
  }

  const hasResume = profile.resume && profile.resume.filename;

  return (
    <div style={{ maxWidth: '900px', margin: '1.5rem auto 3rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.25rem' }}>
            Student Profile & Resume
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Manage your personal details, academic background, skills, and resume document.
          </p>
        </div>
        <Link to="/student/applications" className="btn btn-secondary">
          &larr; My Applications
        </Link>
      </div>

      {/* Status Notice */}
      {statusMessage.text && (
        <div
          style={{
            backgroundColor: statusMessage.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
            color: statusMessage.type === 'success' ? 'var(--success-text)' : 'var(--danger-text)',
            border: `1px solid ${
              statusMessage.type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'
            }`,
            borderRadius: 'var(--radius-md)',
            padding: '0.875rem 1.25rem',
            marginBottom: '1.75rem',
            fontSize: '0.925rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>{statusMessage.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Resume Management Hub */}
      <div className="card" style={{ marginBottom: '2rem', padding: '2rem' }}>
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          📄 Resume Document Hub
        </h3>

        {hasResume ? (
          <div
            style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: 'var(--bg-overlay)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1rem' }}>
                <span style={{ fontSize: '1.35rem' }}>📄</span>
                <span>{profile.resume.filename}</span>
              </div>
              {profile.resume.uploadedAt && (
                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Uploaded on {new Date(profile.resume.uploadedAt).toLocaleDateString()} at{' '}
                  {new Date(profile.resume.uploadedAt).toLocaleTimeString()}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleDownloadResume}
                style={{ padding: '0.45rem 1rem', fontSize: '0.875rem' }}
              >
                Download
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  padding: '0.45rem 1rem',
                  fontSize: '0.875rem',
                  color: 'var(--danger-text)',
                  borderColor: 'var(--danger-border)',
                }}
                onClick={handleDeleteResume}
                disabled={deletingResume}
              >
                {deletingResume ? 'Removing...' : 'Delete'}
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '2rem',
              backgroundColor: 'var(--bg-overlay)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-subtle)',
              marginBottom: '1.5rem',
              textAlign: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
            <p style={{ margin: 0, fontSize: '0.925rem' }}>
              No resume uploaded yet. Attach your PDF or DOCX resume to easily submit applications.
            </p>
          </div>
        )}

        <form onSubmit={handleUploadResume} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <label
              htmlFor="resume-file-input"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                marginBottom: '0.4rem',
                color: 'var(--text-secondary)',
              }}
            >
              {hasResume ? 'Replace Resume (PDF or DOCX, max 5 MB)' : 'Select Resume (PDF or DOCX, max 5 MB)'}
            </label>
            <input
              id="resume-file-input"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              className="form-control"
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!selectedFile || uploadingResume}
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.925rem' }}
          >
            {uploadingResume ? 'Uploading...' : hasResume ? 'Replace Resume' : 'Upload Resume'}
          </button>
        </form>
      </div>

      {/* Profile Details Form Card */}
      <div className="card" style={{ padding: '2rem' }}>
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          👤 Personal & Academic Profile
        </h3>

        <form onSubmit={handleProfileSubmit}>
          {/* Readonly Account Details */}
          <div className="grid grid-cols-2" style={{ gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                Full Name *
              </label>
              <input
                name="name"
                type="text"
                required
                value={profile.name}
                onChange={handleInputChange}
                className="form-control"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                Email Address (Account ID)
              </label>
              <input
                type="email"
                disabled
                value={profile.email}
                className="form-control"
                style={{
                  width: '100%',
                  opacity: 0.6,
                  cursor: 'not-allowed',
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2" style={{ gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                Phone Number
              </label>
              <input
                name="phone"
                type="tel"
                placeholder="+1 234 567 890"
                value={profile.phone}
                onChange={handleInputChange}
                className="form-control"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                Location / City
              </label>
              <input
                name="location"
                type="text"
                placeholder="e.g. San Francisco, CA or Remote"
                value={profile.location}
                onChange={handleInputChange}
                className="form-control"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Academic Background */}
          <div className="grid grid-cols-3" style={{ gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                College / University
              </label>
              <input
                name="college"
                type="text"
                placeholder="e.g. UC Berkeley"
                value={profile.college}
                onChange={handleInputChange}
                className="form-control"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                Degree / Major
              </label>
              <input
                name="degree"
                type="text"
                placeholder="e.g. B.S. Computer Science"
                value={profile.degree}
                onChange={handleInputChange}
                className="form-control"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                Graduation Year
              </label>
              <input
                name="graduationYear"
                type="number"
                min="1950"
                max="2100"
                placeholder="e.g. 2026"
                value={profile.graduationYear}
                onChange={handleInputChange}
                className="form-control"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Bio */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
              Bio / Summary
            </label>
            <textarea
              name="bio"
              rows={3}
              placeholder="Tell recruiters about your background, career goals, and interests..."
              value={profile.bio}
              onChange={handleInputChange}
              className="form-control"
              style={{ width: '100%', lineHeight: 1.5 }}
            />
          </div>

          {/* Skills */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
              Skills (comma separated)
            </label>
            <input
              name="skills"
              type="text"
              placeholder="React, Node.js, Python, MongoDB, Docker, Git"
              value={profile.skills}
              onChange={handleInputChange}
              className="form-control"
              style={{ width: '100%' }}
            />
          </div>

          {/* Social / Portfolio Links */}
          <div className="grid grid-cols-2" style={{ gap: '1.25rem', marginBottom: '2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                GitHub Profile URL
              </label>
              <input
                name="github"
                type="url"
                placeholder="https://github.com/username"
                value={profile.github}
                onChange={handleInputChange}
                className="form-control"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                LinkedIn Profile URL
              </label>
              <input
                name="linkedin"
                type="url"
                placeholder="https://linkedin.com/in/username"
                value={profile.linkedin}
                onChange={handleInputChange}
                className="form-control"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingProfile}
              style={{ minWidth: '170px', padding: '0.7rem 1.4rem' }}
            >
              {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentProfilePage;
