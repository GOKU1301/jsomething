import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { filesAPI, ordersAPI, paymentsAPI } from '../services/api';
import './UploadDocument.css';

const UploadDocument = () => {
    const [file, setFile] = useState(null);
    const [fileId, setFileId] = useState(null);
    const [pageCount, setPageCount] = useState(0);
    const [preferences, setPreferences] = useState({
        copies: 1,
        isColor: false,
        isBinding: false
    });
    const [step, setStep] = useState(1); // 1: Upload, 2: Preferences, 3: Payment
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [amount, setAmount] = useState(0);

    const navigate = useNavigate();

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'application/pdf': ['.pdf']
        },
        maxFiles: 1,
        onDrop: async (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                const selectedFile = acceptedFiles[0];
                setFile(selectedFile);
                setError('');

                // Upload file
                setLoading(true);
                try {
                    const response = await filesAPI.upload(selectedFile);
                    setFileId(response.data.file.id);
                    setPageCount(response.data.file.pageCount);
                    setStep(2);
                } catch (err) {
                    setError(err.response?.data?.error || 'Failed to upload file');
                } finally {
                    setLoading(false);
                }
            }
        }
    });

    const calculatePrice = () => {
        const pricePerPageBW = 2;
        const pricePerPageColor = 10;
        const bindingPrice = 50;

        const pricePerPage = preferences.isColor ? pricePerPageColor : pricePerPageBW;
        const total = (pageCount * preferences.copies * pricePerPage) +
            (preferences.isBinding ? bindingPrice : 0);

        return total;
    };

    const handlePreferenceChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPreferences({
            ...preferences,
            [name]: type === 'checkbox' ? checked : parseInt(value)
        });
    };

    const handleCreateOrder = async () => {
        setLoading(true);
        setError('');

        try {
            // Create order
            const orderResponse = await ordersAPI.create({
                fileId,
                copies: preferences.copies,
                isColor: preferences.isColor,
                isBinding: preferences.isBinding
            });

            const orderId = orderResponse.data.order.id;
            setAmount(orderResponse.data.order.amount);

            // Create payment
            const paymentResponse = await paymentsAPI.create(orderId);

            // Initialize Razorpay
            const options = {
                key: paymentResponse.data.keyId,
                amount: paymentResponse.data.amount * 100, // Convert to paise
                currency: paymentResponse.data.currency,
                name: 'JayPrint',
                description: 'Print Order Payment',
                order_id: paymentResponse.data.razorpayOrderId,
                handler: function (response) {
                    // Payment successful
                    alert('Payment successful! Redirecting to dashboard...');
                    navigate('/dashboard');
                },
                prefill: {
                    email: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : ''
                },
                theme: {
                    color: '#6366f1'
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();

            razorpay.on('payment.failed', function (response) {
                setError('Payment failed. Please try again.');
            });

        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="upload-container">
            <div className="upload-header">
                <div className="container">
                    <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                        ← Back to Dashboard
                    </button>
                </div>
            </div>

            <div className="container">
                <div className="upload-card">
                    <h1>Create Print Order</h1>

                    {/* Progress Steps */}
                    <div className="steps">
                        <div className={`step ${step >= 1 ? 'active' : ''}`}>
                            <div className="step-number">1</div>
                            <div className="step-label">Upload</div>
                        </div>
                        <div className={`step ${step >= 2 ? 'active' : ''}`}>
                            <div className="step-number">2</div>
                            <div className="step-label">Preferences</div>
                        </div>
                        <div className={`step ${step >= 3 ? 'active' : ''}`}>
                            <div className="step-number">3</div>
                            <div className="step-label">Payment</div>
                        </div>
                    </div>

                    {error && <div className="alert alert-error">{error}</div>}

                    {/* Step 1: Upload */}
                    {step === 1 && (
                        <div className="upload-step">
                            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                                <input {...getInputProps()} />
                                <div className="dropzone-content">
                                    <div className="upload-icon">📄</div>
                                    {isDragActive ? (
                                        <p>Drop the PDF file here...</p>
                                    ) : (
                                        <>
                                            <p>Drag & drop a PDF file here, or click to select</p>
                                            <p className="dropzone-hint">Only PDF files are accepted (max 50MB)</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {loading && (
                                <div className="text-center mt-4">
                                    <div className="spinner"></div>
                                    <p className="mt-2">Uploading and processing file...</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Preferences */}
                    {step === 2 && (
                        <div className="preferences-step">
                            <div className="file-info">
                                <h3>📄 {file?.name}</h3>
                                <p>{pageCount} pages</p>
                            </div>

                            <div className="form-group">
                                <label className="label">Number of Copies</label>
                                <input
                                    type="number"
                                    name="copies"
                                    className="input"
                                    value={preferences.copies}
                                    onChange={handlePreferenceChange}
                                    min="1"
                                    max="100"
                                />
                            </div>

                            <div className="checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="isColor"
                                        checked={preferences.isColor}
                                        onChange={handlePreferenceChange}
                                    />
                                    <span>Color Printing (₹10/page)</span>
                                </label>
                            </div>

                            <div className="checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="isBinding"
                                        checked={preferences.isBinding}
                                        onChange={handlePreferenceChange}
                                    />
                                    <span>Binding (₹50)</span>
                                </label>
                            </div>

                            <div className="price-summary">
                                <h3>Price Summary</h3>
                                <div className="price-row">
                                    <span>Pages: {pageCount} × {preferences.copies} copies</span>
                                    <span>₹{pageCount * preferences.copies * (preferences.isColor ? 10 : 2)}</span>
                                </div>
                                {preferences.isBinding && (
                                    <div className="price-row">
                                        <span>Binding</span>
                                        <span>₹50</span>
                                    </div>
                                )}
                                <div className="price-row total">
                                    <strong>Total Amount</strong>
                                    <strong>₹{calculatePrice()}</strong>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setStep(1);
                                        setFile(null);
                                        setFileId(null);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleCreateOrder}
                                    disabled={loading}
                                    style={{ flex: 1 }}
                                >
                                    {loading ? 'Processing...' : 'Proceed to Payment'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadDocument;
