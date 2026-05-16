import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerOffice } from './queueService';
import './BusinessRegistrationPage.css';

const isPartner = () => localStorage.getItem('partnerRole') === 'partner';

const BUSINESS_CATEGORIES = [
  'Restaurant',
  'Salon & Spa',
  'Repair Shop',
  'Medical Clinic',
  'Dental Clinic',
  'Bank & Finance',
  'Government Office',
  'Pharmacy',
  'Grocery & Retail',
  'Education',
  'Legal Services',
  'Real Estate',
  'Automotive',
  'Fitness & Gym',
  'Other',
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function BusinessRegistrationPage() {
  const navigate = useNavigate();
  const photoInputRef = useRef(null);

  // Step tracking
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ['Business Info', 'Contact & Hours', 'Photos', 'Verification', 'Review'];

  // Step 1: Basic info
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [address, setAddress] = useState('');

  // Step 2: Contact & hours
  const [phoneNumber, setPhoneNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [businessHours, setBusinessHours] = useState(
    DAYS.reduce((acc, day) => ({ ...acc, [day]: { open: '09:00', close: '17:00', closed: day === 'Sunday' } }), {})
  );

  // Step 3: Photos
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  // Step 4: Verification documents
  const [businessPermit, setBusinessPermit] = useState(null);
  const [dtiSecRegistration, setDtiSecRegistration] = useState(null);
  const [utilityBill, setUtilityBill] = useState(null);
  const [leaseAgreement, setLeaseAgreement] = useState(null);
  const [taxDocument, setTaxDocument] = useState(null);
  const [additionalNotes, setAdditionalNotes] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files);
    if (photoFiles.length + files.length > 5) {
      setError('Maximum 5 photos allowed.');
      return;
    }
    setError('');

    const newFiles = [...photoFiles, ...files];
    setPhotoFiles(newFiles);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoPreviews((prev) => [...prev, { name: file.name, src: ev.target.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleDayClosed = (day) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], closed: !prev[day].closed },
    }));
  };

  const updateHour = (day, field, value) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const getFileName = (file) => (file ? file.name : null);

  const validateStep = () => {
    setError('');
    switch (currentStep) {
      case 0:
        if (!name.trim()) return setError('Business name is required.');
        if (!category) return setError('Please select a business category.');
        if (!type.trim()) return setError('Service type is required.');
        if (!address.trim()) return setError('Business address is required.');
        break;
      case 1:
        if (!phoneNumber.trim()) return setError('Phone number is required.');
        break;
      case 2:
        // Photos are recommended but not required
        break;
      case 3:
        // Documents are for verification — at least one should ideally be provided
        break;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep() === true) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setError('');
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const formatHoursForSubmit = () => {
    return JSON.stringify(
      Object.entries(businessHours).reduce((acc, [day, val]) => {
        acc[day] = val.closed ? 'Closed' : `${val.open} - ${val.close}`;
        return acc;
      }, {})
    );
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const data = {
        name: name.trim(),
        address: address.trim(),
        type: type.trim().toUpperCase(),
        category: category,
        phoneNumber: phoneNumber.trim(),
        website: website.trim() || null,
        businessHours: formatHoursForSubmit(),
        photos: photoPreviews.map((p) => p.name).join(',') || null,
        businessPermit: getFileName(businessPermit),
        dtiSecRegistration: getFileName(dtiSecRegistration),
        utilityBill: getFileName(utilityBill),
        leaseAgreement: getFileName(leaseAgreement),
        taxDocument: getFileName(taxDocument),
        additionalNotes: additionalNotes.trim() || null,
      };

      const result = await registerOffice(data);
      setSuccess(`Business "${result.name}" registered successfully! Your registration is pending admin approval.`);
      setTimeout(() => navigate('/dashboard/pending'), 2500);
    } catch (err) {
      setError(err.message || 'Failed to register business.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="breg-steps">
      {steps.map((label, i) => (
        <div key={label} className={`breg-step ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}`}>
          <div className="breg-step-circle">
            {i < currentStep ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            ) : (
              <span>{i + 1}</span>
            )}
          </div>
          <span className="breg-step-label">{label}</span>
          {i < steps.length - 1 && <div className="breg-step-line" />}
        </div>
      ))}
    </div>
  );

  const renderStep0 = () => (
    <div className="breg-section">
      <div className="breg-section-header">
        <div className="breg-icon">🏢</div>
        <div>
          <h3>Business Information</h3>
          <p>Tell us about your business</p>
        </div>
      </div>

      <div className="breg-field">
        <label htmlFor="breg-name">Business Name <span className="breg-req">*</span></label>
        <input id="breg-name" type="text" className="breg-input" placeholder="e.g. Maria's Salon & Spa" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="breg-field">
        <label htmlFor="breg-category">Business Category <span className="breg-req">*</span></label>
        <select id="breg-category" className="breg-input breg-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Select a category...</option>
          {BUSINESS_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="breg-field">
        <label htmlFor="breg-type">Service Type <span className="breg-req">*</span></label>
        <input id="breg-type" type="text" className="breg-input" placeholder="e.g. Salon, Clinic, Bank, Restaurant" value={type} onChange={(e) => setType(e.target.value)} />
        <small className="breg-hint">This will be displayed as a tag on your listing</small>
      </div>

      <div className="breg-field">
        <label htmlFor="breg-address">Business Address / Service Area <span className="breg-req">*</span></label>
        <textarea id="breg-address" className="breg-input breg-textarea" placeholder="Full address including city and postal code" rows="3" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="breg-section">
      <div className="breg-section-header">
        <div className="breg-icon">📞</div>
        <div>
          <h3>Contact & Business Hours</h3>
          <p>How can customers reach you?</p>
        </div>
      </div>

      <div className="breg-row">
        <div className="breg-field breg-field-half">
          <label htmlFor="breg-phone">Phone Number <span className="breg-req">*</span></label>
          <input id="breg-phone" type="tel" className="breg-input" placeholder="+63 912 345 6789" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
        </div>
        <div className="breg-field breg-field-half">
          <label htmlFor="breg-website">Website / Social Media <span className="breg-opt">(optional)</span></label>
          <input id="breg-website" type="url" className="breg-input" placeholder="https://facebook.com/yourbusiness" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
      </div>

      <div className="breg-field">
        <label>Business Hours</label>
        <div className="breg-hours-grid">
          {DAYS.map((day) => (
            <div key={day} className={`breg-hour-row ${businessHours[day].closed ? 'closed' : ''}`}>
              <div className="breg-hour-day">
                <label className="breg-toggle">
                  <input type="checkbox" checked={!businessHours[day].closed} onChange={() => toggleDayClosed(day)} />
                  <span className="breg-toggle-slider" />
                </label>
                <span>{day}</span>
              </div>
              {!businessHours[day].closed ? (
                <div className="breg-hour-times">
                  <input type="time" className="breg-input breg-time-input" value={businessHours[day].open} onChange={(e) => updateHour(day, 'open', e.target.value)} />
                  <span className="breg-hour-sep">to</span>
                  <input type="time" className="breg-input breg-time-input" value={businessHours[day].close} onChange={(e) => updateHour(day, 'close', e.target.value)} />
                </div>
              ) : (
                <span className="breg-closed-label">Closed</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="breg-section">
      <div className="breg-section-header">
        <div className="breg-icon">📸</div>
        <div>
          <h3>Business Photos</h3>
          <p>Help customers recognize your business (recommended)</p>
        </div>
      </div>

      <div className="breg-photo-upload" onClick={() => photoInputRef.current?.click()}>
        <div className="breg-photo-upload-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
        <p>Click to upload photos</p>
        <small>Max 5 photos · JPG, PNG, WEBP</small>
        <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotoAdd} />
      </div>

      {photoPreviews.length > 0 && (
        <div className="breg-photo-grid">
          {photoPreviews.map((photo, i) => (
            <div key={i} className="breg-photo-card">
              <img src={photo.src} alt={photo.name} />
              <button type="button" className="breg-photo-remove" onClick={() => removePhoto(i)} title="Remove photo">✕</button>
              <span className="breg-photo-name">{photo.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const DocUpload = ({ label, icon, file, setFile, hint }) => (
    <div className="breg-doc-card">
      <div className="breg-doc-info">
        <span className="breg-doc-icon">{icon}</span>
        <div>
          <strong>{label}</strong>
          {hint && <small>{hint}</small>}
        </div>
      </div>
      {file ? (
        <div className="breg-doc-attached">
          <span className="breg-doc-filename">📎 {file.name}</span>
          <button type="button" className="breg-doc-remove" onClick={() => setFile(null)}>Remove</button>
        </div>
      ) : (
        <label className="breg-doc-upload-btn">
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files[0] || null)} />
          Upload
        </label>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="breg-section">
      <div className="breg-section-header">
        <div className="breg-icon">🛡️</div>
        <div>
          <h3>Verification Documents</h3>
          <p>Prove your business is real for faster approval</p>
        </div>
      </div>

      <div className="breg-docs-list">
        <DocUpload label="Business Permit" icon="📜" file={businessPermit} setFile={setBusinessPermit} hint="Local government permit" />
        <DocUpload label="DTI / SEC Registration" icon="🏛️" file={dtiSecRegistration} setFile={setDtiSecRegistration} hint="Department of Trade registration" />
        <DocUpload label="Utility Bill" icon="💡" file={utilityBill} setFile={setUtilityBill} hint="Recent electricity or water bill" />
        <DocUpload label="Lease Agreement" icon="📋" file={leaseAgreement} setFile={setLeaseAgreement} hint="Proof of property lease" />
        <DocUpload label="Tax Documents" icon="🧾" file={taxDocument} setFile={setTaxDocument} hint="BIR or tax certificate" />
      </div>

      <div className="breg-field">
        <label htmlFor="breg-notes">Additional Notes <span className="breg-opt">(optional)</span></label>
        <textarea id="breg-notes" className="breg-input breg-textarea" placeholder="Any additional information about your business..." rows="3" value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} />
      </div>
    </div>
  );

  const renderStep4 = () => {
    const hoursDisplay = Object.entries(businessHours)
      .map(([day, val]) => `${day}: ${val.closed ? 'Closed' : `${val.open} – ${val.close}`}`)
      .join('\n');

    const docCount = [businessPermit, dtiSecRegistration, utilityBill, leaseAgreement, taxDocument].filter(Boolean).length;

    return (
      <div className="breg-section">
        <div className="breg-section-header">
          <div className="breg-icon">✅</div>
          <div>
            <h3>Review & Submit</h3>
            <p>Please verify all information before submitting</p>
          </div>
        </div>

        <div className="breg-review-grid">
          <div className="breg-review-card">
            <h4>Business Info</h4>
            <div className="breg-review-item"><span>Name</span><strong>{name}</strong></div>
            <div className="breg-review-item"><span>Category</span><strong>{category}</strong></div>
            <div className="breg-review-item"><span>Type</span><strong>{type}</strong></div>
            <div className="breg-review-item"><span>Address</span><strong>{address}</strong></div>
          </div>

          <div className="breg-review-card">
            <h4>Contact</h4>
            <div className="breg-review-item"><span>Phone</span><strong>{phoneNumber}</strong></div>
            <div className="breg-review-item"><span>Website</span><strong>{website || '—'}</strong></div>
          </div>

          <div className="breg-review-card breg-review-wide">
            <h4>Business Hours</h4>
            <pre className="breg-hours-preview">{hoursDisplay}</pre>
          </div>

          <div className="breg-review-card">
            <h4>Photos</h4>
            <strong>{photoPreviews.length} photo(s) attached</strong>
            {photoPreviews.length > 0 && (
              <div className="breg-review-thumbs">
                {photoPreviews.map((p, i) => <img key={i} src={p.src} alt={p.name} />)}
              </div>
            )}
          </div>

          <div className="breg-review-card">
            <h4>Verification</h4>
            <strong>{docCount} document(s) uploaded</strong>
            <ul className="breg-review-docs">
              {businessPermit && <li>📜 Business Permit</li>}
              {dtiSecRegistration && <li>🏛️ DTI/SEC Registration</li>}
              {utilityBill && <li>💡 Utility Bill</li>}
              {leaseAgreement && <li>📋 Lease Agreement</li>}
              {taxDocument && <li>🧾 Tax Documents</li>}
              {docCount === 0 && <li className="breg-muted">No documents uploaded</li>}
            </ul>
          </div>
        </div>

        {additionalNotes && (
          <div className="breg-review-card breg-review-wide">
            <h4>Notes</h4>
            <p>{additionalNotes}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="breg-root">
      <div className="breg-header">
        {!isPartner() && (
          <button type="button" className="breg-back-btn" onClick={() => navigate('/dashboard/map')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back to Map
          </button>
        )}
        <div>
          <h1>Register Your Business</h1>
          <p>Join QuickQueue and let customers queue digitally</p>
        </div>
      </div>

      {renderStepIndicator()}

      {error && <div className="breg-alert breg-alert-error">{error}</div>}
      {success && <div className="breg-alert breg-alert-success">{success}</div>}

      <div className="breg-form-area">
        {currentStep === 0 && renderStep0()}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>

      <div className="breg-actions">
        {currentStep > 0 && (
          <button type="button" className="breg-btn breg-btn-secondary" onClick={prevStep} disabled={submitting}>
            ← Previous
          </button>
        )}
        <div className="breg-actions-spacer" />
        {currentStep < steps.length - 1 ? (
          <button type="button" className="breg-btn breg-btn-primary" onClick={nextStep}>
            Next →
          </button>
        ) : (
          <button type="button" className="breg-btn breg-btn-submit" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <><span className="breg-spinner" /> Submitting...</>
            ) : (
              '🚀 Submit Registration'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
