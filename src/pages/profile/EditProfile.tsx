import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Upload, User, Building2, MapPin, Calendar, DollarSign, Target, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../config/api';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import toast from 'react-hot-toast';

export const EditProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    // Entrepreneur fields
    startupName: '',
    pitchSummary: '',
    fundingNeeded: '',
    industry: '',
    foundedYear: '',
    teamSize: '',
    // Investor fields
    investmentInterests: [] as string[],
    investmentStage: [] as string[],
    minimumInvestment: '',
    maximumInvestment: '',
    portfolioCompanies: [] as string[],
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        location: user.location || '',
        startupName: user.startupName || '',
        pitchSummary: user.pitchSummary || '',
        fundingNeeded: user.fundingNeeded || '',
        industry: user.industry || '',
        foundedYear: user.foundedYear?.toString() || '',
        teamSize: user.teamSize?.toString() || '',
        investmentInterests: user.investmentInterests || [],
        investmentStage: user.investmentStage || [],
        minimumInvestment: user.minimumInvestment || '',
        maximumInvestment: user.maximumInvestment || '',
        portfolioCompanies: user.portfolioCompanies || [],
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (field: string, value: string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, avatar: 'Please select a valid image file' }));
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, avatar: 'File size must be less than 5MB' }));
        return;
      }

      setErrors(prev => ({ ...prev, avatar: '' }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0]) return;

    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', fileInputRef.current.files[0]);

      console.log('Uploading avatar file:', fileInputRef.current.files[0]);

      const response = await userAPI.updateAvatar(formData);
      console.log('Avatar upload response:', response);

      // Update the user state in AuthContext with the new avatar URL
      if (response.data && response.data.data && response.data.data.user) {
        const updatedUser = response.data.data.user;
        console.log('Updated user from response:', updatedUser);
        console.log('New avatar URL:', updatedUser.avatarUrl);

        // Force refresh user data to ensure all components get updated
        if (refreshUser) {
          await refreshUser();
          console.log('User data refreshed from server');
        }
      }

      toast.success('Avatar updated successfully!');
      setAvatarPreview(null);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to update avatar');
    } finally {
      setAvatarLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (user?.role === 'entrepreneur') {
      if (!formData.startupName.trim()) {
        newErrors.startupName = 'Startup name is required';
      }
      if (!formData.pitchSummary.trim()) {
        newErrors.pitchSummary = 'Pitch summary is required';
      }
      if (!formData.fundingNeeded.trim()) {
        newErrors.fundingNeeded = 'Funding needed is required';
      }
      if (!formData.industry.trim()) {
        newErrors.industry = 'Industry is required';
      }
      if (!formData.foundedYear) {
        newErrors.foundedYear = 'Founded year is required';
      }
      if (!formData.teamSize) {
        newErrors.teamSize = 'Team size is required';
      }
    } else if (user?.role === 'investor') {
      if (!formData.minimumInvestment.trim()) {
        newErrors.minimumInvestment = 'Minimum investment is required';
      }
      if (!formData.maximumInvestment.trim()) {
        newErrors.maximumInvestment = 'Maximum investment is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        ...formData,
        foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : undefined,
        teamSize: formData.teamSize ? parseInt(formData.teamSize) : undefined,
      };

      await userAPI.updateProfile(updateData);
      toast.success('Profile updated successfully!');
      navigate(`/profile/${user?.role}/${user?._id}`);
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/profile/${user?.role}/${user?._id}`);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
        <Button
          variant="outline"
          onClick={handleCancel}
          leftIcon={<X size={18} />}
        >
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center space-x-6">
              <Avatar
                src={avatarPreview || user.avatarUrl}
                alt={user.name}
                size="xl"
                className="border-4 border-white shadow-lg"
              />
              <div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  leftIcon={<Upload size={18} />}
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarLoading}
                >
                  {avatarLoading ? 'Uploading...' : 'Change Photo'}
                </Button>
                {errors.avatar && (
                  <p className="text-sm text-red-600 mt-1 flex items-center">
                    <AlertCircle size={16} className="mr-1" />
                    {errors.avatar}
                  </p>
                )}
                {avatarPreview && (
                  <div className="mt-2">
                    <img src={avatarPreview} alt="Avatar Preview" className="h-24 w-24 rounded-full object-cover" />
                    <div className="mt-1 flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAvatarUpload}
                        disabled={avatarLoading}
                      >
                        Upload
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAvatarPreview(null)}
                        disabled={avatarLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-1">JPG, PNG or GIF. Max size 5MB.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                startAdornment={<User size={18} />}
              />

              <Input
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                startAdornment={<MapPin size={18} />}
                placeholder="Enter your location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Tell us about yourself..."
                maxLength={500}
              />
              <p className="text-sm text-gray-500 mt-1">{formData.bio.length}/500 characters</p>
            </div>
          </CardBody>
        </Card>

        {/* Role-specific Information */}
        {user.role === 'entrepreneur' ? (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Startup Information</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Startup Name"
                  name="startupName"
                  value={formData.startupName}
                  onChange={handleInputChange}
                  required
                  startAdornment={<Building2 size={18} />}
                />

                <Input
                  label="Industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  required
                  startAdornment={<Target size={18} />}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Founded Year"
                  name="foundedYear"
                  type="number"
                  value={formData.foundedYear}
                  onChange={handleInputChange}
                  required
                  startAdornment={<Calendar size={18} />}
                  min="1900"
                  max={new Date().getFullYear()}
                />

                <Input
                  label="Team Size"
                  name="teamSize"
                  type="number"
                  value={formData.teamSize}
                  onChange={handleInputChange}
                  required
                  min="1"
                />

                <Input
                  label="Funding Needed"
                  name="fundingNeeded"
                  value={formData.fundingNeeded}
                  onChange={handleInputChange}
                  required
                  startAdornment={<DollarSign size={18} />}
                  placeholder="e.g., $100k, $1M"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pitch Summary
                </label>
                <textarea
                  name="pitchSummary"
                  value={formData.pitchSummary}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Describe your startup's mission, problem, and solution..."
                  required
                />
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Investment Preferences</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Minimum Investment"
                  name="minimumInvestment"
                  value={formData.minimumInvestment}
                  onChange={handleInputChange}
                  required
                  startAdornment={<DollarSign size={18} />}
                  placeholder="e.g., $10k, $50k"
                />

                <Input
                  label="Maximum Investment"
                  name="maximumInvestment"
                  value={formData.maximumInvestment}
                  onChange={handleInputChange}
                  required
                  startAdornment={<DollarSign size={18} />}
                  placeholder="e.g., $500k, $2M"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Interests
                </label>
                <div className="flex flex-wrap gap-2">
                  {['SaaS', 'FinTech', 'HealthTech', 'E-commerce', 'AI/ML', 'Blockchain', 'IoT', 'Mobile Apps'].map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => {
                        const current = formData.investmentInterests;
                        const updated = current.includes(interest)
                          ? current.filter(i => i !== interest)
                          : [...current, interest];
                        handleArrayChange('investmentInterests', updated);
                      }}
                      className={`px-3 py-1 rounded-full text-sm border ${
                        formData.investmentInterests.includes(interest)
                          ? 'bg-primary-100 text-primary-800 border-primary-300'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Stages
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Pre-seed', 'Seed', 'Series A', 'Series B', 'Growth'].map((stage) => (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => {
                        const current = formData.investmentStage;
                        const updated = current.includes(stage)
                          ? current.filter(s => s !== stage)
                          : [...current, stage];
                        handleArrayChange('investmentStage', updated);
                      }}
                      className={`px-3 py-1 rounded-full text-sm border ${
                        formData.investmentStage.includes(stage)
                          ? 'bg-secondary-100 text-secondary-800 border-secondary-300'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            leftIcon={<Save size={18} />}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};
