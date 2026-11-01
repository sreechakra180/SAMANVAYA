"""
Satark-NLP Live Model Demonstration Script
Run this script to showcase the fraud detection model to mentors.
Usage:
    python scripts/demo_model.py
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import json
from app.services.ml_service import analyze_text, get_model_metadata

def print_banner():
    print("=" * 70)
    print("  \033[1;36mSATARK-NLP: REAL-TIME FRAUD DETECTION & IOC EXTRACTION MODEL\033[0m")
    print("=" * 70)

def display_result(text: str):
    res = analyze_text(text)
    print(f"\n\033[1mInput Text:\033[0m \"{text}\"")
    
    if res["is_scam"]:
        status_color = "\033[1;31m[SCAM DETECTED]\033[0m"
    else:
        status_color = "\033[1;32m[LEGITIMATE MESSAGE]\033[0m"
        
    print(f"Status:       {status_color}")
    print(f"Probability:  \033[1;33m{res['scam_probability'] * 100:.2f}%\033[0m")
    print(f"Category:     \033[1;35m{res['predicted_category'].upper()}\033[0m")
    print(f"Risk Level:   \033[1;31m{res['risk_level']}\033[0m")
    
    phones = res["extracted_iocs"]["phones"]
    upis = res["extracted_iocs"]["upis"]
    urls = res["extracted_iocs"]["urls"]
    
    print("Extracted IOCs:")
    print(f"  - Phone Numbers: {phones if phones else 'None'}")
    print(f"  - UPI Handles:   {upis if upis else 'None'}")
    print(f"  - Phishing URLs: {urls if urls else 'None'}")
    
    if res["risk_signals"]:
        print(f"Trigger Signals: \033[33m{', '.join(res['risk_signals'])}\033[0m")
    print(f"Inference Time:  {res['inference_latency_ms']} ms")
    print("-" * 70)

def run_showcase():
    print_banner()
    meta = get_model_metadata()
    print(f"Architecture: {meta.get('architecture', 'TF-IDF + Calibrated Logistic')}")
    print(f"Accuracy:     {float(meta.get('binary_accuracy', 1.0)) * 100:.2f}% | F1-Score: {meta.get('binary_f1', 1.0)}")
    print(f"Categories:   {', '.join(meta.get('supported_categories', [])[:6])}...")
    print("=" * 70)
    
    test_cases = [
        "This is Inspector Sharma from CBI headquarters New Delhi. A parcel containing MDMA drugs was seized with your Aadhaar card. You are placed under digital arrest. Stay on Skype call or police will arrest you.",
        "Dear consumer, your electricity power will be disconnected tonight at 9:30 PM from the electric office because previous month bill was not updated. Immediately contact electricity officer at 9876543210.",
        "Dear SBI customer, your YONO account has been suspended today due to expired KYC. Please click link http://sbi-kyc-update.xyz to submit Aadhaar and PAN immediately.",
        "Earn Rs 3000 to 8000 daily by working from home! Simple YouTube video liking task. Contact HR on WhatsApp 9811223344 or Telegram @task_mall.",
        "Your SBI account 1234 is credited with Rs 45,000 on 31-Oct-2026 by NEFT salary transfer. Avail balance Rs 54,230."
    ]
    
    for case in test_cases:
        display_result(case)

if __name__ == "__main__":
    run_showcase()
    
    if len(sys.argv) > 1 and sys.argv[1] == "--interactive":
        print("\n\033[1;32mInteractive Mode Enabled. Type your message below (or 'exit'):\033[0m")
        while True:
            try:
                line = input("\nEnter text > ").strip()
                if not line or line.lower() == "exit":
                    break
                display_result(line)
            except (KeyboardInterrupt, EOFError):
                break
