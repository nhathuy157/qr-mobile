import React, { useState} from 'react';
import banksData from './banksData'; // Tệp chứa dữ liệu ngân hàng
import './App.css';

function QRCodeForm() {
  const [selectedBank, setSelectedBank] = useState('');
  const [bankDetails, setBankDetails] = useState({ BANK: '', STK: '', CTK: '' });
  const [amount, setAmount] = useState('');
  const [descriptionPrefix, setDescriptionPrefix] = useState('');
  const [descriptionSuffix] = useState(Date.now());
  const [statusMessage, setStatusMessage] = useState('');
  const [qrSrc, setQrSrc] = useState('');
  const [showImage, setShowImage] = useState(false);

  // Khi chọn thương hiệu
  const handleSelectChange = (e) => {
    const selectedLabel = e.target.value;
    setSelectedBank(selectedLabel);
    const bank = banksData.find(b => b.LABEL === selectedLabel);

    if (selectedLabel === 'Tùy chỉnh') {
      setBankDetails({ BANK: '', STK: '', CTK: '' });
    } else if (bank) {
      setBankDetails({ BANK: bank.BANK, STK: bank.STK, CTK: bank.CTK });
    }
  };

  // Khi tạo QR code
  const handleCreateQr = async () => {
    if (!bankDetails.STK || !amount) {
      setStatusMessage("Vui lòng nhập đủ thông tin!");
      setShowImage(false);
      return;
    }

    const bankId = bankDetails.BANK.split(' - ')[2];
    const srcTemplate = `https://img.vietqr.io/image/${bankId}-${bankDetails.STK}-print.png?amount=${amount}&addInfo=${descriptionPrefix} ${descriptionSuffix}&accountName=${bankDetails.CTK}`;
    
    setQrSrc(srcTemplate);
    setShowImage(true);

    const imageQR = new Image();
    imageQR.crossOrigin = "anonymous";
    imageQR.src = srcTemplate;

    imageQR.onload = async function () {
      const canvas = document.createElement("canvas");
      canvas.width = imageQR.width;
      canvas.height = imageQR.height;
      const ctx = canvas.getContext("2d");

      // Vẽ mã QR trước
      ctx.drawImage(imageQR, 0, 0, imageQR.width, imageQR.height);

      // Tìm logo và khung của ngân hàng trong dữ liệu
      const foundBank = banksData.find(b => b.STK === bankDetails.STK);
      if (foundBank) {
        const logoImg = new Image();
        const logoText = new Image();
        const logoFrame = new Image();
        
        [logoImg, logoText, logoFrame].forEach(img => { img.crossOrigin = "anonymous"; });

        // Kiểm tra và tải hình ảnh logo, text, frame
        if (foundBank.LOGO_IMG) logoImg.src = foundBank.LOGO_IMG;
        if (foundBank.LOGO_TEXT) logoText.src = foundBank.LOGO_TEXT;
        if (foundBank.FRAME) logoFrame.src = foundBank.FRAME;

        const imagesToLoad = [logoImg, logoText, logoFrame].filter(img => img.src);
        let countLoad = 0;

        // Đợi cho đến khi tất cả các hình ảnh được tải
        imagesToLoad.forEach(img => {
          img.onload = () => { countLoad++; };
        });

        while (countLoad < imagesToLoad.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Vẽ logo text
        if (logoText.src) {
            let height = 190;
            let width = Math.round(logoText.width * height / logoText.height);
            if (width > 620) {
                width = 620; height = Math.round(logoText.height * width / logoText.width);
            }
            const x = Math.round((canvas.width - width) / 2);
            const y = Math.round((190 - height) / 2);
            ctx.fillStyle = "white"; ctx.fillRect(0, 0, 1000, 190); 
            ctx.drawImage(logoText, x, y, width, height);   // Vẽ text vào canvas
        }

        // Vẽ logo ảnh
        if (logoImg.src && logoImg.width === logoImg.height && logoImg.width > 0) {
            ctx.fillStyle = "white"; ctx.fillRect(460, 460, 85, 85); 
            ctx.drawImage(logoImg, 455, 455, 95, 95); 
        }

        if (logoFrame.src) {
            ctx.drawImage(logoFrame, 0, 0, canvas.width, canvas.height);
        }

        // Chuyển canvas thành ảnh
        canvas.toBlob(async (blob) => {
          const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

          // Nếu là máy tính, copy vào clipboard
          if (!isMobile && navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
            setStatusMessage("QR đã được copy!");
          } else {
            // Nếu là mobile, tải về
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = 'qr_code.png'; // Tên file khi tải về
            downloadLink.click();  // Kích hoạt tải về
            setStatusMessage("Ảnh đã được tải về.");
          }
        }, "image/png");
      }
    };
  };

  return (
    <div className="container">
      <form id="qrForm">
        <h2>Tạo mã QR</h2>

        <div className="form-group">
          <label htmlFor="bank_select">Thương hiệu</label>
          <select id="bank_select" value={selectedBank} onChange={handleSelectChange}>
            <option value="" disabled>Chọn thương hiệu</option>
            {banksData.map(bank => (
              <option key={bank.LABEL} value={bank.LABEL}>{bank.LABEL}</option>
            ))}
            <option value="Tùy chỉnh">Tùy chỉnh</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="banks">Ngân hàng</label>
          <input type="text" id="banks" value={bankDetails.BANK} disabled />
        </div>

        <div className="form-group">
          <label htmlFor="ACCOUNT_NO">Số tài khoản</label>
          <input type="text" id="ACCOUNT_NO" value={bankDetails.STK} disabled />
        </div>

        <div className="form-group">
          <label htmlFor="ACCOUNT_NAME">Chủ tài khoản</label>
          <input type="text" id="ACCOUNT_NAME" value={bankDetails.CTK} disabled />
        </div>

        <div className="form-group">
          <label htmlFor="AMOUNT">Số tiền</label>
          <input type="text" id="AMOUNT" placeholder="Nhập số tiền..." value={amount} onChange={e => setAmount(e.target.value)} />
        </div>

        <div className="form-group">
          <label htmlFor="DESCRIPTION">Nội dung</label>
          <div className="input-container">
            <input type="text" id="DESCRIPTION_PREFIX" value={descriptionPrefix} onChange={e => setDescriptionPrefix(e.target.value)} />
            <input type="text" id="DESCRIPTION_SUFFIX" value={descriptionSuffix} disabled />
          </div>
        </div>

        <button type="button" className="btn btn-success" onClick={handleCreateQr}>Tạo mã QR</button>

        {statusMessage && <p id="status">{statusMessage}</p>}
      </form>

      {showImage && (
        <div>
          <img id="imageQR" src={qrSrc} alt="QR Code" width="1000px" style={{ display: 'block' }} />
        </div>
      )}
    </div>
  );
}

export default QRCodeForm;
