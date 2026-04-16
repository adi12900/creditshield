export type LoanTypeCategory =
  | 'Personal Loan'
  | 'Car Loan'
  | 'Home Loan'
  | 'Gold Loan'
  | 'Education Loan'
  | 'Business Loan';

export type LoanSpecificFieldType = 'text' | 'number' | 'select';

export interface LoanSpecificFieldConfig {
  key: string;
  label: string;
  type: LoanSpecificFieldType;
  required: boolean;
  options?: string[];
}

export interface RequiredDocumentConfig {
  label: string;
  evidenceType: string;
  mandatory: boolean;
  multiple?: boolean;
  accept?: 'image' | 'document' | 'mixed';
  captureCamera?: boolean;
}

export interface EvidenceSectionConfig {
  title: 'Residence Proof' | 'Business Proof' | 'Loan-Specific Proof';
  items: RequiredDocumentConfig[];
}

export interface LoanTypeConfig {
  key: LoanTypeCategory;
  verificationFocus: string[];
  specificFields: LoanSpecificFieldConfig[];
  evidenceSections: EvidenceSectionConfig[];
}

export const LOAN_TYPE_OPTIONS: LoanTypeCategory[] = [
  'Personal Loan',
  'Car Loan',
  'Home Loan',
  'Gold Loan',
  'Education Loan',
  'Business Loan',
];

export const LOAN_TYPE_CONFIG: Record<LoanTypeCategory, LoanTypeConfig> = {
  'Personal Loan': {
    key: 'Personal Loan',
    verificationFocus: [
      'Employment verification',
      'Income estimation',
      'Expenses & repayment capacity',
      'Purpose of loan',
    ],
    specificFields: [
      { key: 'purpose_of_loan', label: 'Purpose of Loan', type: 'text', required: true },
      { key: 'urgency_level', label: 'Urgency Level', type: 'select', required: true, options: ['Low', 'Medium', 'High'] },
    ],
    evidenceSections: [
      {
        title: 'Residence Proof',
        items: [
          { label: 'House Front Photo', evidenceType: 'house_front_photo', mandatory: true, accept: 'image', captureCamera: true },
          { label: 'Address Proof Board / Landmark Photo', evidenceType: 'landmark_photo', mandatory: true, accept: 'image', captureCamera: true },
          { label: 'Applicant Live Photo', evidenceType: 'applicant_live_photo', mandatory: false, accept: 'image', captureCamera: true },
        ],
      },
      {
        title: 'Loan-Specific Proof',
        items: [
          { label: 'Salary Proof', evidenceType: 'salary_proof', mandatory: false, accept: 'document' },
          { label: 'Bank Statement', evidenceType: 'bank_statement', mandatory: false, accept: 'document' },
        ],
      },
    ],
  },
  'Car Loan': {
    key: 'Car Loan',
    verificationFocus: [
      'Car model & dealer details',
      'Vehicle price estimation',
      'Down payment',
      'Dealer verification',
    ],
    specificFields: [
      { key: 'car_model', label: 'Car Model', type: 'text', required: true },
      { key: 'vehicle_price_estimation', label: 'Vehicle Price Estimation', type: 'number', required: true },
      { key: 'down_payment', label: 'Down Payment', type: 'number', required: true },
      { key: 'dealer_verified', label: 'Dealer Verified', type: 'select', required: true, options: ['Yes', 'No'] },
    ],
    evidenceSections: [
      {
        title: 'Residence Proof',
        items: [
          { label: 'Applicant House Photo', evidenceType: 'applicant_house_photo', mandatory: true, accept: 'image', captureCamera: true },
          { label: 'Parking Space Photo', evidenceType: 'parking_space_photo', mandatory: true, accept: 'image', captureCamera: true },
        ],
      },
      {
        title: 'Loan-Specific Proof',
        items: [
          { label: 'Car Dealer Location Photo', evidenceType: 'dealer_location_photo', mandatory: true, accept: 'image', captureCamera: true },
          { label: 'Proforma Invoice Upload', evidenceType: 'proforma_invoice', mandatory: true, accept: 'document' },
        ],
      },
    ],
  },
  'Home Loan': {
    key: 'Home Loan',
    verificationFocus: [
      'Property type',
      'Property ownership',
      'Builder/project verification',
      'Property valuation',
    ],
    specificFields: [
      { key: 'property_type', label: 'Property Type', type: 'text', required: true },
      { key: 'property_ownership', label: 'Property Ownership', type: 'select', required: true, options: ['Self', 'Joint', 'Family'] },
      { key: 'builder_project_verified', label: 'Builder/Project Verified', type: 'select', required: true, options: ['Yes', 'No'] },
      { key: 'property_valuation', label: 'Property Valuation', type: 'number', required: true },
    ],
    evidenceSections: [
      {
        title: 'Residence Proof',
        items: [
          { label: 'Property Exterior Photo', evidenceType: 'property_exterior_photo', mandatory: true, accept: 'image', captureCamera: true },
          { label: 'Property Interior Photo', evidenceType: 'property_interior_photo', mandatory: true, accept: 'image', captureCamera: true },
          { label: 'Nearby Landmark Photo', evidenceType: 'nearby_landmark_photo', mandatory: true, accept: 'image', captureCamera: true },
        ],
      },
      {
        title: 'Loan-Specific Proof',
        items: [
          { label: 'Builder/Project Board Photo', evidenceType: 'builder_project_board_photo', mandatory: true, accept: 'image', captureCamera: true },
        ],
      },
    ],
  },
  'Gold Loan': {
    key: 'Gold Loan',
    verificationFocus: [
      'Gold type (ornaments/coins)',
      'Weight estimation',
      'Purity check',
      'Storage location verification',
    ],
    specificFields: [
      { key: 'gold_type', label: 'Gold Type', type: 'select', required: true, options: ['Ornaments', 'Coins'] },
      { key: 'estimated_weight', label: 'Estimated Weight', type: 'number', required: true },
      { key: 'purity_check', label: 'Purity Check (approx)', type: 'text', required: true },
      { key: 'storage_location_verification', label: 'Storage Location Verification', type: 'text', required: true },
    ],
    evidenceSections: [
      {
        title: 'Loan-Specific Proof',
        items: [
          { label: 'Gold Items Photo', evidenceType: 'gold_items_photo', mandatory: true, accept: 'image', captureCamera: true, multiple: true },
          { label: 'Close-up Image (Purity View)', evidenceType: 'gold_purity_closeup', mandatory: true, accept: 'image', captureCamera: true },
          { label: 'Storage Location Photo', evidenceType: 'gold_storage_location_photo', mandatory: true, accept: 'image', captureCamera: true },
        ],
      },
    ],
  },
  'Education Loan': {
    key: 'Education Loan',
    verificationFocus: [
      'Student details',
      'Course name & duration',
      'College/institute verification',
      '10th / 12th / diploma percentages',
      'Admission proof verification',
    ],
    specificFields: [
      { key: 'student_details', label: 'Student Details', type: 'text', required: true },
      { key: 'course_name_duration', label: 'Course Name & Duration', type: 'text', required: true },
      { key: 'college_verified', label: 'College/Institute Verified', type: 'select', required: true, options: ['Yes', 'No'] },
      { key: 'admission_proof_verified', label: 'Admission Proof Verified', type: 'select', required: true, options: ['Yes', 'No'] },
    ],
    evidenceSections: [
      {
        title: 'Residence Proof',
        items: [
          { label: 'Student Photo', evidenceType: 'student_photo', mandatory: true, accept: 'image', captureCamera: true },
        ],
      },
      {
        title: 'Loan-Specific Proof',
        items: [
          { label: 'College Building Photo', evidenceType: 'college_building_photo', mandatory: true, accept: 'image', captureCamera: true },
          { label: 'Admission Letter Upload', evidenceType: 'admission_letter', mandatory: true, accept: 'document' },
          { label: 'Marksheet Upload (10th / 12th / Diploma)', evidenceType: 'marksheet_upload', mandatory: true, accept: 'document', multiple: true },
        ],
      },
    ],
  },
  'Business Loan': {
    key: 'Business Loan',
    verificationFocus: [
      'Business profile verification',
      'Cashflow quality',
      'Repayment capacity from business operations',
      'Business continuity evidence',
    ],
    specificFields: [
      { key: 'business_profile', label: 'Business Profile', type: 'text', required: true },
      { key: 'monthly_turnover_estimate', label: 'Monthly Turnover Estimate', type: 'number', required: true },
      { key: 'business_premises_verified', label: 'Business Premises Verified', type: 'select', required: true, options: ['Yes', 'No'] },
      { key: 'business_continuity_score', label: 'Business Continuity Indicator', type: 'select', required: true, options: ['Low', 'Medium', 'High'] },
    ],
    evidenceSections: [
      {
        title: 'Business Proof',
        items: [
          { label: 'Shop Front Photo', evidenceType: 'shop_front_photo', mandatory: true, accept: 'image', captureCamera: true },
          { label: 'Inside Shop Photo', evidenceType: 'inside_shop_photo', mandatory: true, accept: 'image', captureCamera: true },
          { label: 'Business Activity Photo', evidenceType: 'business_activity_photo', mandatory: true, accept: 'image', captureCamera: true },
        ],
      },
      {
        title: 'Loan-Specific Proof',
        items: [
          { label: 'GST/Registration Proof Upload', evidenceType: 'gst_registration_proof', mandatory: true, accept: 'document' },
        ],
      },
    ],
  },
};

export function normalizeLoanType(rawLoanType: string): LoanTypeCategory {
  const value = (rawLoanType || '').toLowerCase();
  if (value.includes('car') || value.includes('vehicle') || value.includes('auto')) return 'Car Loan';
  if (value.includes('home') || value.includes('housing') || value.includes('property')) return 'Home Loan';
  if (value.includes('gold')) return 'Gold Loan';
  if (value.includes('education') || value.includes('student')) return 'Education Loan';
  if (value.includes('business') || value.includes('msme') || value.includes('working')) return 'Business Loan';
  return 'Personal Loan';
}
