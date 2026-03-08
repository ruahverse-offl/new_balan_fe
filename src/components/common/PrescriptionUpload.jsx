import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadPrescription } from '../../services/prescriptionsApi';
import './PrescriptionUpload.css';

const PrescriptionUpload = ({ onUploadSuccess, onUploadError, maxSizeMB = 5 }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error' | null
    const [errorMessage, setErrorMessage] = useState('');
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            setErrorMessage('Please upload an image (JPG, PNG, WebP) or PDF file');
            return;
        }

        // Validate file size
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            setErrorMessage(`File size must be less than ${maxSizeMB}MB`);
            return;
        }

        setSelectedFile(file);
        setErrorMessage('');
        setUploadStatus(null);

        // Create preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setUploadProgress(0);
        setUploadStatus(null);
        setErrorMessage('');

        try {
            // Show progress animation during upload
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            // Call real backend API
            const result = await uploadPrescription(selectedFile);

            clearInterval(progressInterval);
            setUploadProgress(100);

            // Success
            setUploadStatus('success');
            if (onUploadSuccess) {
                onUploadSuccess({
                    file: selectedFile,
                    referenceId: result.id || result.file_name,
                    fileName: selectedFile.name,
                    prescriptionId: result.id,
                    ...result,
                });
            }

            // Reset after 3 seconds
            setTimeout(() => {
                handleReset();
            }, 3000);

        } catch (error) {
            setUploadStatus('error');
            setErrorMessage(error.message || 'Upload failed. Please try again.');
            if (onUploadError) {
                onUploadError(error);
            }
        } finally {
            setUploading(false);
        }
    };

    const handleReset = () => {
        setSelectedFile(null);
        setPreview(null);
        setUploadProgress(0);
        setUploadStatus(null);
        setErrorMessage('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemove = () => {
        handleReset();
    };

    return (
        <div className="prescription-upload-container">
            <div className="prescription-upload-header">
                <h3>Upload Prescription</h3>
                <p>Upload your prescription image or PDF (Max {maxSizeMB}MB)</p>
            </div>

            {!selectedFile ? (
                <div className="upload-area">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*,application/pdf"
                        hidden
                    />
                    <button
                        type="button"
                        className="upload-trigger-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        <Upload size={24} />
                        <span>Choose File</span>
                    </button>
                    <p className="upload-hint">Supports: JPG, PNG, WebP, PDF</p>
                </div>
            ) : (
                <div className="file-preview-container">
                    {preview ? (
                        <div className="image-preview">
                            <img src={preview} alt="Prescription preview" />
                            <button
                                type="button"
                                className="remove-btn"
                                onClick={handleRemove}
                                disabled={uploading}
                            >
                                <X size={18} />
                            </button>
                        </div>
                    ) : (
                        <div className="file-info">
                            <FileText size={32} className="file-icon" />
                            <div className="file-details">
                                <p className="file-name">{selectedFile.name}</p>
                                <p className="file-size">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                            <button
                                type="button"
                                className="remove-btn"
                                onClick={handleRemove}
                                disabled={uploading}
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="error-message">
                            <AlertCircle size={16} />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {uploading && (
                        <div className="upload-progress">
                            <div className="progress-bar-container">
                                <div
                                    className="progress-bar"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <div className="progress-info">
                                <Loader2 size={16} className="spinner" />
                                <span>Uploading... {uploadProgress}%</span>
                            </div>
                        </div>
                    )}

                    {uploadStatus === 'success' && (
                        <div className="upload-success">
                            <CheckCircle size={20} />
                            <span>Prescription uploaded successfully!</span>
                        </div>
                    )}

                    {uploadStatus === 'error' && (
                        <div className="upload-error">
                            <AlertCircle size={20} />
                            <span>{errorMessage || 'Upload failed. Please try again.'}</span>
                        </div>
                    )}

                    {!uploading && !uploadStatus && (
                        <div className="upload-actions">
                            <button
                                type="button"
                                className="btn-upload"
                                onClick={handleUpload}
                            >
                                <Upload size={18} />
                                Upload Prescription
                            </button>
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={handleRemove}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PrescriptionUpload;
