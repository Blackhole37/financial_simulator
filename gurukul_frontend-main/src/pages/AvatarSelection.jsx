import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import GlassContainer from "../components/GlassContainer";
import { toast } from "react-hot-toast";
import gsap from "gsap";
import {
  Save,
  User,
  Image as ImageIcon,
} from "lucide-react";
import { selectUser } from "../store/authSlice";
// Removed unused imports

export default function AvatarSelection() {
  const user = useSelector(selectUser);
  const containerRef = useRef(null);

  // AI Model Generation state
  const [selectedAIModel, setSelectedAIModel] = useState(null);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [activeTab, setActiveTab] = useState('avatar'); // 'avatar' or 'background'
  const [generationMethod, setGenerationMethod] = useState('text'); // 'text' or 'image'
  const [uploadedImage, setUploadedImage] = useState(null);
  const [textPrompt, setTextPrompt] = useState('');

  // Tab configuration
  const tabs = [
    {
      id: 'avatar',
      name: 'Avatar',
      icon: User,
      description: 'Generate 3D avatars'
    },
    {
      id: 'background',
      name: 'Background',
      icon: ImageIcon,
      description: 'Generate environments'
    }
  ];

  // Animation effects
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
      );
    }
  }, []);

  // Handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle generation
  const handleGenerate = () => {
    if (generationMethod === 'text' && !textPrompt.trim()) {
      toast.error('Please enter a description');
      return;
    }
    if (generationMethod === 'image' && !uploadedImage) {
      toast.error('Please upload an image');
      return;
    }

    // Here you would call your AI generation API
    toast.success(`Generating ${activeTab} from ${generationMethod}...`);
  };

  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Reset form when switching tabs
    setTextPrompt('');
    setUploadedImage(null);
    setGenerationMethod('text');
  };

  // Save avatar configuration
  const handleSaveAvatar = async () => {
    try {
      const avatarConfig = {
        aiModel: selectedAIModel,
        background: selectedBackground,
        userId: user?.id || "guest",
        timestamp: new Date().toISOString(),
      };

      // Here you would typically save to your backend/database
      console.log("Saving AI avatar configuration:", avatarConfig);

      // For now, save to localStorage
      localStorage.setItem("aiAvatarConfig", JSON.stringify(avatarConfig));

      toast.success("AI Avatar configuration saved successfully!");
    } catch (error) {
      console.error("Error saving avatar configuration:", error);
      toast.error("Failed to save avatar configuration");
    }
  };

  // Removed unused handler

  return (
    <div className="h-full">
      <GlassContainer>
        <div ref={containerRef} className="flex flex-col h-full">
          {/* Simple Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              AI Avatar Generator
            </h1>
            <p className="text-white/60">
              Generate 3D avatars from text or images
            </p>
          </div>

          <div className="flex-1 flex flex-col">
            {/* Tab Navigation */}
            <div className="flex space-x-2 mb-6 justify-center">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center justify-center space-x-2 px-8 py-3 rounded-lg transition-all min-w-[140px] ${
                      activeTab === tab.id
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium text-sm">{tab.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Content Area */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column - Generation Options */}
              <div className="lg:col-span-3">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 h-full">
                  <h2 className="text-xl font-semibold text-white mb-6">
                    {activeTab === 'avatar' ? 'Generate Avatar' : 'Generate Background'}
                  </h2>

                  {/* Generation Method Tabs */}
                  <div className="flex space-x-1 mb-6 bg-white/5 rounded-lg p-1">
                    <button
                      onClick={() => setGenerationMethod('text')}
                      className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md ${
                        generationMethod === 'text'
                          ? 'bg-blue-500/20 border border-blue-500/30'
                          : ''
                      }`}
                    >
                      <span className={`text-sm font-medium transition-colors ${
                        generationMethod === 'text'
                          ? 'text-blue-400'
                          : 'text-white/70 hover:text-white'
                      }`}>
                        Text to {activeTab === 'avatar' ? '3D' : 'Environment'}
                      </span>
                    </button>
                    <button
                      onClick={() => setGenerationMethod('image')}
                      className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md ${
                        generationMethod === 'image'
                          ? 'bg-blue-500/20 border border-blue-500/30'
                          : ''
                      }`}
                    >
                      <span className={`text-sm font-medium transition-colors ${
                        generationMethod === 'image'
                          ? 'text-blue-400'
                          : 'text-white/70 hover:text-white'
                      }`}>
                        Image to {activeTab === 'avatar' ? '3D' : 'Environment'}
                      </span>
                    </button>
                  </div>

                  {/* Generation Form */}
                  <div className="flex flex-col flex-1 space-y-6">
                    {/* Input Section - Fixed Height */}
                    <div className="flex flex-col h-[200px]">
                      {generationMethod === 'text' ? (
                        <div className="flex flex-col h-full">
                          <label className="block text-white/80 text-sm font-medium mb-2">
                            {activeTab === 'avatar' ? 'Describe your avatar' : 'Describe your environment'}
                          </label>
                          <textarea
                            value={textPrompt}
                            onChange={(e) => setTextPrompt(e.target.value)}
                            placeholder={activeTab === 'avatar'
                              ? "e.g., futuristic robot with glowing blue eyes..."
                              : "e.g., cyberpunk city with neon lights..."
                            }
                            className="w-full flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none resize-none"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col h-full">
                          <label className="block text-white/80 text-sm font-medium mb-2">
                            Upload reference image
                          </label>
                          <div className="flex-1 border-2 border-dashed border-white/20 rounded-lg p-4 text-center hover:border-white/30 transition-colors flex items-center justify-center">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id="image-upload"
                              onChange={handleImageUpload}
                            />
                            <label htmlFor="image-upload" className="cursor-pointer">
                              {uploadedImage ? (
                                <div>
                                  <img
                                    src={uploadedImage}
                                    alt="Uploaded"
                                    className="w-16 h-16 object-cover rounded-lg mx-auto mb-2"
                                  />
                                  <p className="text-green-400 text-sm">Image uploaded</p>
                                  <p className="text-white/50 text-xs mt-1">Click to change</p>
                                </div>
                              ) : (
                                <div>
                                  <ImageIcon className="w-8 h-8 text-white/50 mx-auto mb-2" />
                                  <p className="text-white/70 text-sm">Click to upload image</p>
                                  <p className="text-white/50 text-xs mt-1">PNG, JPG up to 10MB</p>
                                </div>
                              )}
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Settings Row - Quality and Style side by side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">Quality</label>
                        <select className="w-full h-[44px] px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-blue-400 focus:outline-none">
                          <option value="medium" className="bg-gray-800">Medium (Balanced)</option>
                          <option value="low" className="bg-gray-800">Low (Fast)</option>
                          <option value="high" className="bg-gray-800">High (Slow)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">Style</label>
                        <select className="w-full h-[44px] px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-blue-400 focus:outline-none">
                          <option value="realistic" className="bg-gray-800">Realistic</option>
                          <option value="cartoon" className="bg-gray-800">Cartoon</option>
                          <option value="stylized" className="bg-gray-800">Stylized</option>
                          <option value="low-poly" className="bg-gray-800">Low Poly</option>
                        </select>
                      </div>
                    </div>

                    {/* Centered Generate Button */}
                    <div className="flex justify-center">
                      <button
                        onClick={handleGenerate}
                        className="px-12 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
                      >
                        Generate {activeTab === 'avatar' ? 'Avatar' : 'Background'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Preview */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 h-full flex flex-col">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Preview
                </h2>

                {/* Preview Display */}
                <div className="flex-1 bg-black/20 rounded-lg border border-white/10 overflow-hidden mb-4">
                  <div className="w-full h-full flex items-center justify-center">
                    {activeTab === 'avatar' ? (
                      <div className="flex flex-col items-center justify-center text-white/50">
                        <User className="w-16 h-16 mb-3 opacity-50" />
                        <p className="text-sm">Generate avatar to preview</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-white/50">
                        <ImageIcon className="w-16 h-16 mb-3 opacity-50" />
                        <p className="text-sm">Generate background to preview</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveAvatar}
                  disabled={!selectedAIModel && !selectedBackground}
                  className="w-full px-4 py-3 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <Save className="mr-2 w-4 h-4" />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </GlassContainer>
    </div>
  );
}
