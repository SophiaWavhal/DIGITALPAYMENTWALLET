import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import '../styles/QRGenerator.css';

const QRGenerator = () => {
  const [qrValue, setQrValue] = useState('https://easypay.com/pay/yourusername');
  const [size, setSize] = useState(256);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [fgColor, setFgColor] = useState('#000000');
  const [includeLogo, setIncludeLogo] = useState(false);

  const downloadQR = () => {
    const canvas = document.getElementById("qr-code");
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    let downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = "easypay-qr.png";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="qr-generator-container">
      <h2>Generate Your QR Code</h2>
      <p>Share this QR code to receive payments instantly</p>
      
      <div className="qr-generator-content">
        <div className="qr-code-display">
          <div className="qr-code-wrapper">
            <QRCodeCanvas
              id="qr-code"
              value={qrValue}
              size={size}
              bgColor={bgColor}
              fgColor={fgColor}
              level="H"
              includeMargin={true}
              imageSettings={
                includeLogo
                  ? {
                      src: "https://i.imgur.com/3bXQeNS.png",
                      height: 50,
                      width: 50,
                      excavate: true,
                    }
                  : undefined
              }
            />
          </div>
          <button onClick={downloadQR} className="download-btn">
            Download QR Code
          </button>
        </div>

        <div className="qr-settings">
          <div className="form-group">
            <label>QR Code Content</label>
            <input
              type="text"
              value={qrValue}
              onChange={(e) => setQrValue(e.target.value)}
              placeholder="Enter URL or text"
            />
          </div>

          <div className="form-group">
            <label>Size (px)</label>
            <input
              type="number"
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value) || 256)}
              min="100"
              max="1000"
            />
          </div>

          <div className="form-group">
            <label>Background Color</label>
            <div className="color-picker">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
              />
              <input
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Foreground Color</label>
            <div className="color-picker">
              <input
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
              />
              <input
                type="text"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="includeLogo"
              checked={includeLogo}
              onChange={(e) => setIncludeLogo(e.target.checked)}
            />
            <label htmlFor="includeLogo">Include EasyPay Logo</label>
          </div>
        </div>
      </div>

      <div className="qr-usage-tips">
        <h3>How to use your QR code</h3>
        <ul>
          <li>Display it at your shop for customers to scan and pay</li>
          <li>Share it with friends to receive money quickly</li>
          <li>Print it on invoices for easy payment</li>
          <li>Add it to your website or social media profiles</li>
        </ul>
      </div>
    </div>
  );
};

export default QRGenerator;
