export const IDENTIFIER_TYPES: Array<{ key: 'phone' | 'upi' | 'url' | 'sender_id'; label: string; placeholder: string }> = [
  { key: 'phone',    label: 'Phone number',    placeholder: '+91 98765 43210' },
  { key: 'upi',      label: 'UPI / Email',    placeholder: 'ravi12@okaxis' },
  { key: 'url',      label: 'Web URL',        placeholder: 'https://example.com/kyc' },
  { key: 'sender_id',label: 'Sender ID',      placeholder: 'HDFCBK' },
]

export const CHANNELS = ['Phone call', 'SMS or WhatsApp', 'QR code', 'Fake website', 'UPI request', 'Something else'] as const
export type Channel = (typeof CHANNELS)[number]

export const SCAM_TYPE_OPTIONS = [
  { key: 'digital-arrest', label: 'Digital Arrest (Police / CBI / Court)' },
  { key: 'electricity-disconnection', label: 'Electricity Disconnection Notice' },
  { key: 'fake-kyc-link', label: 'Bank / SIM KYC Expiry Phishing' },
  { key: 'job-offer', label: 'Telegram / YouTube Task Scam' },
  { key: 'lottery-prize', label: 'KBC Lottery / Lucky Draw Prize' },
  { key: 'courier-customs', label: 'FedEx / Customs Narcotics Parcel' },
  { key: 'loan-app-harassment', label: 'Instant Loan APK Extortion' },
  { key: 'investment-group', label: 'Crypto / Stock Market VIP Group' },
  { key: 'sextortion', label: 'Video Call Blackmail' },
  { key: 'fake-customer-care', label: 'Fake Customer Care Helpline' },
  { key: 'upi-refund-qr', label: 'Reverse UPI Payment / QR Code' },
  { key: 'other', label: 'Other Phishing Incident' },
]

export const SCAM_TYPES = [
  'digital-arrest', 'fake-kyc-link', 'upi-refund-qr', 'investment-group',
  'courier-customs', 'job-offer', 'lottery-prize', 'loan-app-harassment',
  'electricity-disconnection', 'fake-customer-care', 'otp-call', 'sextortion', 'other',
] as const
export type ScamType = (typeof SCAM_TYPES)[number]

export const TIME_CHIPS: Array<{ label: string; value: 't1h' | 't24h' | 't7d' }> = [
  { label: 'Last 1 hour', value: 't1h' },
  { label: 'Last 24 hours', value: 't24h' },
  { label: 'Last 7 days', value: 't7d' },
]

export const AREAS: Record<string, { locality: string; city: string; pincode: string; lat: number; lng: number }> = {
  '560102': { locality: 'HSR Layout', city: 'Bengaluru', pincode: '560102', lat: 12.9116, lng: 77.6473 },
  '560038': { locality: 'Indiranagar', city: 'Bengaluru', pincode: '560038', lat: 12.9784, lng: 77.6408 },
  '560034': { locality: 'Koramangala', city: 'Bengaluru', pincode: '560034', lat: 12.9352, lng: 77.6245 },
  '560066': { locality: 'Whitefield', city: 'Bengaluru', pincode: '560066', lat: 12.9698, lng: 77.7500 },
  '560076': { locality: 'BTM Layout', city: 'Bengaluru', pincode: '560076', lat: 12.9166, lng: 77.6101 },
  '560011': { locality: 'Jayanagar', city: 'Bengaluru', pincode: '560011', lat: 12.9299, lng: 77.5826 },
  '560037': { locality: 'Marathahalli', city: 'Bengaluru', pincode: '560037', lat: 12.9591, lng: 77.6974 },
  '560103': { locality: 'Bellandur', city: 'Bengaluru', pincode: '560103', lat: 12.9260, lng: 77.6762 },
  '560100': { locality: 'Electronic City', city: 'Bengaluru', pincode: '560100', lat: 12.8452, lng: 77.6602 },
  '560078': { locality: 'JP Nagar', city: 'Bengaluru', pincode: '560078', lat: 12.9077, lng: 77.5851 },
  '560003': { locality: 'Malleshwaram', city: 'Bengaluru', pincode: '560003', lat: 13.0035, lng: 77.5709 },
  '560010': { locality: 'Rajajinagar', city: 'Bengaluru', pincode: '560010', lat: 12.9915, lng: 77.5520 },
  '560024': { locality: 'Hebbal', city: 'Bengaluru', pincode: '560024', lat: 13.0358, lng: 77.5970 },
  '560064': { locality: 'Yelahanka', city: 'Bengaluru', pincode: '560064', lat: 13.1007, lng: 77.5963 },
  '560070': { locality: 'Banashankari', city: 'Bengaluru', pincode: '560070', lat: 12.9250, lng: 77.5468 },
  '400050': { locality: 'Bandra West', city: 'Mumbai', pincode: '400050', lat: 19.0596, lng: 72.8295 },
  '110016': { locality: 'Hauz Khas', city: 'Delhi', pincode: '110016', lat: 28.5494, lng: 77.2001 },
  '500081': { locality: 'Madhapur', city: 'Hyderabad', pincode: '500081', lat: 17.4486, lng: 78.3908 },
  '600020': { locality: 'Adyar', city: 'Chennai', pincode: '600020', lat: 13.0012, lng: 80.2565 },
  '411014': { locality: 'Viman Nagar', city: 'Pune', pincode: '411014', lat: 18.5679, lng: 73.9143 },
  '700091': { locality: 'Salt Lake Sector V', city: 'Kolkata', pincode: '700091', lat: 22.5790, lng: 88.4290 },
  '380015': { locality: 'Satellite', city: 'Ahmedabad', pincode: '380015', lat: 23.0260, lng: 72.5085 },
  '302017': { locality: 'Malviya Nagar', city: 'Jaipur', pincode: '302017', lat: 26.8570, lng: 75.8080 },
  '226010': { locality: 'Gomti Nagar', city: 'Lucknow', pincode: '226010', lat: 26.8540, lng: 80.9990 },
  '682030': { locality: 'Kakkanad', city: 'Kochi', pincode: '682030', lat: 10.0159, lng: 76.3419 },
}
