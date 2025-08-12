"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Camera, UserPlus, ArrowLeft, Check, X } from 'lucide-react';
import Link from 'next/link';

interface PersonData {
  name: string;
  email?: string;
  department?: string;
  images: File[];
}

export default function ManagePage() {
  const [personData, setPersonData] = useState<PersonData>({
    name: '',
    email: '',
    department: '',
    images: []
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof PersonData, value: string) => {
    setPersonData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    setPersonData(prev => ({
      ...prev,
      images: [...prev.images, ...imageFiles].slice(0, 5) // Limit to 5 images
    }));
  };

  const removeImage = (index: number) => {
    setPersonData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!personData.name.trim()) {
      alert('Please enter a name for the person.');
      return;
    }

    if (personData.images.length === 0) {
      alert('Please upload at least one image.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      const formData = new FormData();
      formData.append('name', personData.name.trim());
      formData.append('email', personData.email || '');
      formData.append('department', personData.department || '');
      
      personData.images.forEach((image, index) => {
        formData.append(`image-${index}`, image);
      });

      const response = await fetch('/api/add-person', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadStatus('success');
        setPersonData({ name: '', email: '', department: '', images: [] });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading person:', error);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Attendance
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Manage People</h1>
          <p className="text-gray-600 mt-2">
            Add new people to the facial recognition system
          </p>
        </div>

        {/* Status Messages */}
        {uploadStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-green-800">Person added successfully!</p>
            </div>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <X className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-800">Failed to add person. Please try again.</p>
            </div>
          </div>
        )}

        {/* Add Person Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              Add New Person
            </CardTitle>
            <CardDescription>
              Provide person details and upload clear photos for best recognition accuracy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={personData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter full name"
                    required
                    className="mt-1"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email (Optional)
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={personData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="email@example.com"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="department" className="text-sm font-medium">
                      Department (Optional)
                    </Label>
                    <Input
                      id="department"
                      type="text"
                      value={personData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="e.g., Engineering, Marketing"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <Label className="text-sm font-medium">
                  Photos * (Maximum 5 images)
                </Label>
                <div className="mt-2">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Click to upload images or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, JPEG up to 10MB each
                      </p>
                    </label>
                  </div>
                </div>

                {/* Image Previews */}
                {personData.images.length > 0 && (
                  <div className="mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {personData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {personData.images.length} of 5 images uploaded
                    </p>
                  </div>
                )}
              </div>

              {/* Guidelines */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  📸 Photo Guidelines for Best Results:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use clear, well-lit photos showing the full face</li>
                  <li>• Include photos from different angles (front, slight left/right)</li>
                  <li>• Avoid sunglasses, hats, or objects covering the face</li>
                  <li>• Upload 3-5 different photos for better accuracy</li>
                  <li>• Ensure the person is the main subject in each photo</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  disabled={isUploading || !personData.name.trim() || personData.images.length === 0}
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding Person...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Person
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
