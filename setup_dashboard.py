#!/usr/bin/env python3
"""
Setup script for Agricultural Economy Dashboard
This script helps set up the dashboard and run the initial data processing
"""

import os
import sys
import subprocess
from pathlib import Path
import json

def create_directory_structure():
    """Create the necessary directory structure"""
    print("📁 Creating directory structure...")
    
    directories = [
        "ag-economy-dashboard",
        "ag-economy-dashboard/css",
        "ag-economy-dashboard/js",
        "ag-economy-dashboard/data",
        "ag-economy-dashboard/data/raw",
        "ag-economy-dashboard/assets",
        ".github/workflows"
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"   ✓ Created {directory}")
    
    print("✅ Directory structure created\n")

def install_dependencies():
    """Install required Python packages"""
    print("📦 Installing Python dependencies...")
    
    packages = ["pandas", "requests", "openpyxl"]
    
    for package in packages:
        print(f"   Installing {package}...")
        subprocess.run([sys.executable, "-m", "pip", "install", package], 
                      capture_output=True, text=True)
    
    print("✅ Dependencies installed\n")

def check_excel_files():
    """Check if Excel files are in place"""
    print("📊 Checking for Excel data files...")
    
    raw_path = Path("ag-economy-dashboard/data/raw")
    required_files = [
        "DistrictSurveysofAgCreditConditionsHistoricalData version 1.xlsx",
        "NationalSurveyofTermsofLending_HistoricalDataQ22025.xlsx",
        "Q12025CommercialBankCallReportDataHistoricalData.xlsx"
    ]
    
    files_present = []
    files_missing = []
    
    for filename in required_files:
        filepath = raw_path / filename
        if filepath.exists():
            files_present.append(filename)
            print(f"   ✓ Found: {filename}")
        else:
            files_missing.append(filename)
            print(f"   ✗ Missing: {filename}")
    
    if files_missing:
        print(f"\n⚠️  Please copy the following files to {raw_path}:")
        for f in files_missing:
            print(f"   - {f}")
        return False
    
    print("✅ All Excel files found\n")
    return True

def create_requirements_file():
    """Create requirements.txt for the project"""
    print("📝 Creating requirements.txt...")
    
    requirements = """pandas>=1.5.0
requests>=2.28.0
openpyxl>=3.0.0
"""
    
    with open("requirements.txt", "w") as f:
        f.write(requirements)
    
    print("✅ requirements.txt created\n")

def test_federal_reserve_urls():
    """Test if Federal Reserve URLs are accessible"""
    print("🌐 Testing Federal Reserve data URLs...")
    
    import requests
    
    # These are example URLs - they need to be replaced with actual Fed URLs
    test_urls = {
        "Kansas City Fed": "https://www.kansascityfed.org/agriculture/",
        "Federal Reserve": "https://www.federalreserve.gov/data.htm"
    }
    
    for name, url in test_urls.items():
        try:
            response = requests.head(url, timeout=5)
            if response.status_code < 400:
                print(f"   ✓ {name} is accessible")
            else:
                print(f"   ⚠️  {name} returned status {response.status_code}")
        except:
            print(f"   ✗ Could not reach {name}")
    
    print("\n💡 Note: You'll need to update the URLs in update_ag_data.py with the actual")
    print("   Federal Reserve download links for the Excel files.\n")

def run_initial_update():
    """Run the data update script for the first time"""
    print("🚀 Running initial data update...")
    print("   This will process your Excel files into JSON format\n")
    
    try:
        result = subprocess.run(
            [sys.executable, "update_ag_data.py", "--use-local"],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ Data processing completed successfully!")
            
            # Check created files
            data_path = Path("ag-economy-dashboard/data")
            json_files = list(data_path.glob("*.json"))
            
            if json_files:
                print("\n📄 Created JSON files:")
                for f in json_files:
                    size = f.stat().st_size / 1024  # Size in KB
                    print(f"   - {f.name} ({size:.1f} KB)")
        else:
            print("⚠️  Data processing encountered issues:")
            print(result.stderr)
            
    except FileNotFoundError:
        print("❌ Could not find update_ag_data.py")
        print("   Please ensure the update script is in the current directory")

def create_sample_html_test():
    """Create a simple test file to verify dashboard works"""
    print("\n🧪 Creating test file...")
    
    test_html = """<!DOCTYPE html>
<html>
<head>
    <title>Dashboard Test</title>
</head>
<body>
    <h1>Agricultural Dashboard Test</h1>
    <p>If you can see this, your dashboard directory is set up correctly!</p>
    <p><a href="index.html">Go to main dashboard</a></p>
    
    <h2>JSON Data Files:</h2>
    <ul id="fileList"></ul>
    
    <script>
        // Test loading JSON files
        fetch('data/district-surveys.json')
            .then(r => r.json())
            .then(data => {
                const list = document.getElementById('fileList');
                const item = document.createElement('li');
                item.textContent = `district-surveys.json loaded - ${Object.keys(data.series || {}).length} series found`;
                list.appendChild(item);
            })
            .catch(e => {
                console.error('Could not load district-surveys.json:', e);
            });
    </script>
</body>
</html>"""
    
    test_path = Path("ag-economy-dashboard/test.html")
    with open(test_path, "w") as f:
        f.write(test_html)
    
    print(f"✅ Test file created at {test_path}\n")

def main():
    """Main setup process"""
    print("=" * 60)
    print("🌾 Agricultural Economy Dashboard Setup")
    print("=" * 60)
    print()
    
    # Step 1: Create directories
    create_directory_structure()
    
    # Step 2: Install dependencies
    install_dependencies()
    
    # Step 3: Create requirements.txt
    create_requirements_file()
    
    # Step 4: Check for Excel files
    if not check_excel_files():
        print("\n⏸️  Setup paused. Please add the Excel files and run this script again.")
        return
    
    # Step 5: Test Fed URLs
    test_federal_reserve_urls()
    
    # Step 6: Run initial data update
    run_initial_update()
    
    # Step 7: Create test file
    create_sample_html_test()
    
    print("\n" + "=" * 60)
    print("✨ Setup Complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Copy the dashboard HTML file to ag-economy-dashboard/index.html")
    print("2. Update the Federal Reserve URLs in update_ag_data.py")
    print("3. Test the dashboard by opening ag-economy-dashboard/test.html")
    print("4. Commit everything to Git and push to GitHub")
    print("5. The GitHub Action will run quarterly to update the data")
    print("\nManual update command: python update_ag_data.py")
    print("Test with local files: python update_ag_data.py --use-local")

if __name__ == "__main__":
    main()