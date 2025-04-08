// QRScanner.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import QrScanner from 'qr-scanner';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/QRScanner.css';

const QRScanner = ({ onTransactionComplete }) => {
  const videoRef = useRef(null);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [scanner, setScanner] = useState(null);
  const [preview, setPreview] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const stopScanner = useCallback(() => {
    if (scanner) {
      try {
        scanner.stop?.();
        scanner.destroy?.();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
      setScanner(null);
      setIsScanning(false);
    }
  }, [scanner]);

  const extractPaymentInfo = (qrData) => {
    try {
      const data = JSON.parse(qrData);
      if (data.email) {
        return {
          email: data.email,
          description: data.description || 'QR Payment',
          presetAmount: data.amount
        };
      }
    } catch (e) {}
    if (qrData.startsWith('upi://') || qrData.includes('@')) {
      const upiMatch = qrData.match(/pa=([^&]*)/) || qrData.match(/([\w.-]+@[\w.-]+)/);
      if (upiMatch?.[1]) {
        return {
          email: upiMatch[1],
          description: 'QR Payment',
          presetAmount: qrData.match(/am=([^&]*)/)?.[1]
        };
      }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(qrData)) {
      return { email: qrData, description: 'QR Payment' };
    }
    const amountMatch = qrData.match(/(?:amount|value)=([0-9.]+)/i);
    if (amountMatch) {
      return {
        email: qrData.match(/(?:to|recipient)=([^&]+)/i)?.[1] || '',
        description: 'QR Payment',
        presetAmount: amountMatch[1]
      };
    }
    return { email: '', description: qrData };
  };

  useEffect(() => {
    const initializeScanner = async () => {
      if (videoRef.current && !scanner && isScanning) {
        const currentScanner = new QrScanner(
          videoRef.current,
          (scanResult) => {
            const paymentInfo = extractPaymentInfo(scanResult.data);
            setResult(scanResult.data);
            setRecipientEmail(paymentInfo.email || '');
            setDescription(paymentInfo.description);
            if (paymentInfo.presetAmount) setAmount(paymentInfo.presetAmount);
            stopScanner();
          },
          {
            preferredCamera: 'environment',
            highlightScanRegion: true,
            returnDetailedScanResult: true
          }
        );
        await currentScanner.start();
        setScanner(currentScanner);
      }
    };
    initializeScanner();
    return () => {
      stopScanner();
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [isScanning, stopScanner, preview]);

  const startScanner = () => {
    setResult('');
    setError('');
    setPreview('');
    setRecipientEmail('');
    setDescription('');
    setAmount('');
    setIsScanning(true);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      stopScanner();
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);
      QrScanner.scanImage(selectedFile)
        .then((scanResult) => {
          const paymentInfo = extractPaymentInfo(scanResult);
          setResult(scanResult);
          setRecipientEmail(paymentInfo.email || '');
          setDescription(paymentInfo.description);
          if (paymentInfo.presetAmount) setAmount(paymentInfo.presetAmount);
        })
        .catch(() => setError('No QR code found in image'));
    }
  };

  const handlePayment = async () => {
    if (!recipientEmail && !result) return setError('Scan QR or enter email');
    const finalRecipient = recipientEmail || prompt('Enter recipient email:');
    if (!finalRecipient) return setError('Recipient email required');
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0)
      return setError('Enter valid amount');

    setIsProcessing(true);
    setError('');

    try {
      const response = await axios.post(
        'http://localhost:5000/api/transactions/qr-payment',
        {
          recipientEmail: finalRecipient,
          amount: parseFloat(amount),
          description: description || 'QR Payment',
        },
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      alert(`Payment of ₹${amount} was successful!`);
      setResult('');
      setAmount('');
      setDescription('');
      if (onTransactionComplete) onTransactionComplete();
      window.dispatchEvent(new Event('transactionUpdated'));
      navigate('/transactions');
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || 'Payment failed. Try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="qr-scanner-container">
      <h2>QR Code Payment</h2>
      <p>Scan or upload QR code to make payment</p>

      {!result && !error && (
        <div className="scanner-section">
          <video ref={videoRef} className="scanner-video" playsInline />
          {!isScanning ? (
            <button onClick={startScanner}>Start Scanner</button>
          ) : (
            <button onClick={stopScanner}>Stop Scanner</button>
          )}
          <div>
            <label>
              Upload QR Code
              <input type="file" accept="image/*" onChange={handleFileChange} hidden />
            </label>
            {preview && <img src={preview} alt="Preview" />}
          </div>
        </div>
      )}

      {(result || error) && (
        <div>
          {result && (
            <>
              <p>Recipient: {recipientEmail}</p>
              <input
                type="email"
                placeholder="Recipient Email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
              <input
                type="number"
                placeholder="Amount (₹)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <input
                type="text"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <button onClick={handlePayment} disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Confirm Payment'}
              </button>
            </>
          )}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button onClick={startScanner}>Scan Again</button>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
