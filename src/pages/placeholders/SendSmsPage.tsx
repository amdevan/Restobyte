import React, { useState, useMemo } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Customer } from '@/types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import { FiSend, FiSmartphone, FiCopy, FiPhone } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';

const SendSmsPage: React.FC = () => {
  const { customers, sendSms, getSingleActiveOutlet } = useRestaurantData();
  const currentOutlet = getSingleActiveOutlet();
  const whatsappNumber = currentOutlet?.whatsappNumber || '';

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customPhone, setCustomPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  // Predefined message templates
  const messageTemplates = [
    { label: 'Order Ready', message: 'Your order is ready for pickup. Please collect it from the restaurant. Thank you!' },
    { label: 'Order Confirmation', message: 'Thank you for your order! We have received it and will prepare it soon.' },
    { label: 'Delivery on the way', message: 'Your order is on the way! Estimated arrival time is 30 minutes.' },
    { label: 'Table Reservation', message: 'Your table reservation has been confirmed. We look forward to serving you!' },
  ];

  const handleSendSms = async () => {
    const phone = selectedCustomer?.phone || customPhone;
    if (!phone || !message.trim()) {
      setSendResult({ success: false, message: 'Please enter a phone number and message.' });
      return;
    }

    setIsSending(true);
    setSendResult(null);
    try {
      const result = await sendSms(phone, message);
      setSendResult(result);
      if (result.success) {
        setMessage('');
        setSelectedCustomer(null);
        setCustomPhone('');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleTemplateSelect = (templateMessage: string) => {
    setMessage(templateMessage);
  };

  const whatsappLink = useMemo(() => {
    if (!whatsappNumber) return '';
    const encodedMessage = encodeURIComponent(message || 'Hello, I would like to place an order.');
    return `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodedMessage}`;
  }, [whatsappNumber, message]);

  const handleCopyLink = async () => {
    if (whatsappLink) {
      await navigator.clipboard.writeText(whatsappLink);
      // Show brief feedback
      const btn = document.getElementById('copy-link-btn');
      if (btn) {
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy Link'; }, 2000);
      }
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Send SMS & WhatsApp</h1>
        <Button
          variant="secondary"
          onClick={() => setShowQrModal(true)}
          leftIcon={<FiSmartphone />}
        >
          WhatsApp QR Login
        </Button>
      </div>

      {/* Send Result */}
      {sendResult && (
        <div className={`mb-4 p-3 rounded-md ${sendResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {sendResult.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SMS Composition */}
        <div className="lg:col-span-2 space-y-4">
          {/* Recipient Selection */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-3">Recipient</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer</label>
                <select
                  value={selectedCustomer?.id || ''}
                  onChange={(e) => {
                    const customer = customers.find(c => c.id === e.target.value);
                    setSelectedCustomer(customer || null);
                    if (customer) setCustomPhone(customer.phone);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone && `(${c.phone})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Or Enter Phone Number</label>
                <Input
                  type="tel"
                  placeholder="+1234567890"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Message Templates */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-3">Message Templates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {messageTemplates.map((template) => (
                <Button
                  key={template.label}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleTemplateSelect(template.message)}
                >
                  {template.label}
                </Button>
              ))}
            </div>
          </Card>

          {/* Message Editor */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-3">Message</h2>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="Enter your message here..."
            />
            <div className="mt-2 text-xs text-gray-500">
              Character count: {message.length}
            </div>
          </Card>

          {/* Send Button */}
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={handleSendSms}
              disabled={isSending || !message.trim() || !(selectedCustomer?.phone || customPhone)}
              leftIcon={isSending ? undefined : <FiSend />}
            >
              {isSending ? 'Sending...' : 'Send SMS'}
            </Button>
          </div>
        </div>

        {/* WhatsApp QR Code */}
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-3">WhatsApp QR Login</h2>
            {whatsappNumber ? (
              <>
                <div className="flex justify-center p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <QRCodeSVG value={whatsappLink} size={192} />
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Scan to open WhatsApp with your message pre-filled
                </p>
                <div className="mt-4 space-y-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={handleCopyLink}
                    id="copy-link-btn"
                    leftIcon={<FiCopy />}
                  >
                    Copy Link
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(whatsappLink, '_blank')}
                    leftIcon={<FiSmartphone />}
                  >
                    Open in WhatsApp
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FiSmartphone className="mx-auto text-4xl mb-2" />
                <p>No WhatsApp number configured.</p>
                <p className="text-xs mt-1">Set it in Settings → Website Settings</p>
              </div>
            )}
          </Card>

          {/* WhatsApp Number Display */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-3">WhatsApp Number</h2>
            {whatsappNumber ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FiPhone className="text-green-600" />
                  <span className="font-medium">{whatsappNumber}</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(whatsappNumber)}
                  leftIcon={<FiCopy />}
                >
                  Copy
                </Button>
              </div>
            ) : (
              <p className="text-gray-500">Not configured</p>
            )}
          </Card>
        </div>
      </div>

      {/* WhatsApp QR Modal (full screen) */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">WhatsApp QR Login</h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            {whatsappNumber ? (
              <>
                <div className="flex justify-center p-6 bg-white border-2 border-gray-200 rounded-lg mb-4">
                  <QRCodeSVG value={whatsappLink} size={256} />
                </div>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Scan this QR code with your phone's WhatsApp app to start a conversation with your pre-filled message.
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={handleCopyLink}
                    leftIcon={<FiCopy />}
                  >
                    Copy Link
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      window.open(whatsappLink, '_blank');
                      setShowQrModal(false);
                    }}
                    leftIcon={<FiSmartphone />}
                  >
                    Open WhatsApp
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FiSmartphone className="mx-auto text-4xl mb-2" />
                <p>No WhatsApp number configured.</p>
                <p className="text-xs mt-1">Set it in Settings → Website Settings</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SendSmsPage;
