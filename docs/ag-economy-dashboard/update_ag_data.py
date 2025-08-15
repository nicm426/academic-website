#!/usr/bin/env python3
"""
Agricultural Economy Dashboard Data Updater
Author: William N. McWilliams
Description: Downloads and processes Federal Reserve agricultural data quarterly
"""

import os
import json
import pandas as pd
import requests
from datetime import datetime
import logging
from pathlib import Path
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('data_update.log'),
        logging.StreamHandler()
    ]
)

class AgDataUpdater:
    """Handles downloading and processing of Federal Reserve agricultural data"""
    
    def __init__(self, base_path="ag-economy-dashboard"):
        self.base_path = Path(base_path)
        self.data_path = self.base_path / "data"
        self.raw_path = self.data_path / "raw"
        
        # Create directories if they don't exist
        self.raw_path.mkdir(parents=True, exist_ok=True)
        
        # Federal Reserve data URLs - Kansas City Fed Agricultural Finance Databook
        self.data_sources = {
            'district_surveys': {
                'url': 'https://www.kansascityfed.org/Ag%20Finance%20Book/documents/7230/DistrictSurveysofAgCreditConditionsHistoricalData.xlsx',
                'filename': 'DistrictSurveysofAgCreditConditionsHistoricalData.xlsx',
                'name': 'District Surveys of Ag Credit Conditions'
            },
            'lending_terms': {
                'url': 'https://www.kansascityfed.org/Ag%20Finance%20Book/documents/7225/NationalSurveyofTermsofLending_HistoricalDataQ22025.xlsx',
                'filename': 'NationalSurveyofTermsofLending_HistoricalData.xlsx',
                'name': 'National Survey of Terms of Lending'
            },
            'call_reports': {
                'url': 'https://www.kansascityfed.org/Ag%20Finance%20Book/documents/7228/Q12025-CommercialBankCallReportDataHistoricalData.xlsx',
                'filename': 'CommercialBankCallReportDataHistoricalData.xlsx',
                'name': 'Commercial Bank Call Report Data'
            }
        }
        
        self.update_metadata = {
            'last_update': None,
            'data_through': None,
            'next_update': None,
            'status': 'pending'
        }
    
    def download_file(self, url, filepath):
        """Download file from URL with error handling"""
        try:
            logging.info(f"Downloading from {url}")
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            logging.info(f"Successfully downloaded to {filepath}")
            return True
            
        except requests.exceptions.RequestException as e:
            logging.error(f"Failed to download {url}: {str(e)}")
            return False
    
    def process_district_surveys(self, filepath):
        """Process District Surveys Excel file into JSON"""
        try:
            logging.info("Processing District Surveys data...")
            
            # Read Excel file
            df_data = pd.read_excel(filepath, sheet_name='Data')
            df_desc = pd.read_excel(filepath, sheet_name='Description')
            
            # Process data
            data_json = {
                'metadata': {
                    'source': 'Federal Reserve District Surveys',
                    'updated': datetime.now().strftime('%Y-%m-%d'),
                    'frequency': 'Quarterly',
                    'units': 'Diffusion Index (0-200, 100=no change)'
                },
                'series': {},
                'descriptions': {}
            }
            
            # Convert data to JSON-friendly format
            for col in df_data.columns[1:]:  # Skip date column
                if col in df_desc['Statistic Identifier'].values:
                    desc_row = df_desc[df_desc['Statistic Identifier'] == col].iloc[0]
                    
                    # Store series data
                    series_data = []
                    for idx, row in df_data.iterrows():
                        value = row[col]
                        if pd.notna(value) and value != '---':
                            series_data.append({
                                'date': row['Date'],
                                'value': float(value) if value != '---' else None
                            })
                    
                    data_json['series'][col] = series_data
                    
                    # Store description
                    data_json['descriptions'][col] = {
                        'description': desc_row['Description '],
                        'unit': desc_row['Unit'],
                        'district': desc_row['Federal Reserve District'],
                        'frequency': desc_row['Frequency ']
                    }
            
            # Calculate summary statistics
            data_json['summary'] = self.calculate_summary_stats(data_json['series'])
            
            # Save to JSON
            output_path = self.data_path / 'district-surveys.json'
            with open(output_path, 'w') as f:
                json.dump(data_json, f, indent=2)
            
            logging.info(f"Saved processed data to {output_path}")
            return True
            
        except Exception as e:
            logging.error(f"Failed to process District Surveys: {str(e)}")
            return False
    
    def process_lending_terms(self, filepath):
        """Process National Survey of Terms of Lending Excel file"""
        try:
            logging.info("Processing Terms of Lending data...")
            
            # Read Excel file
            df_data = pd.read_excel(filepath, sheet_name='Data')
            df_desc = pd.read_excel(filepath, sheet_name='Descriptions')
            
            # Process data
            data_json = {
                'metadata': {
                    'source': 'Federal Reserve National Survey of Terms of Lending',
                    'updated': datetime.now().strftime('%Y-%m-%d'),
                    'frequency': 'Quarterly'
                },
                'series': {},
                'descriptions': {}
            }
            
            # Get date column (first column)
            date_col = df_data.columns[0]
            
            # Process each series
            for col in df_data.columns[1:]:
                if col in df_desc['Statistic Identifier'].values:
                    desc_row = df_desc[df_desc['Statistic Identifier'] == col].iloc[0]
                    
                    # Store series data
                    series_data = []
                    for idx, row in df_data.iterrows():
                        if pd.notna(row[date_col]) and pd.notna(row[col]):
                            series_data.append({
                                'date': str(row[date_col]),
                                'value': float(row[col]) if row[col] not in ['---', None] else None
                            })
                    
                    data_json['series'][col] = series_data
                    
                    # Store description
                    data_json['descriptions'][col] = {
                        'statistic': desc_row['Statistic'],
                        'attribute1': desc_row.get('Attribute1', ''),
                        'attribute2': desc_row.get('Attribute2', ''),
                        'unit': desc_row['Unit']
                    }
            
            # Calculate summary statistics
            data_json['summary'] = self.calculate_summary_stats(data_json['series'])
            
            # Save to JSON
            output_path = self.data_path / 'lending-terms.json'
            with open(output_path, 'w') as f:
                json.dump(data_json, f, indent=2)
            
            logging.info(f"Saved processed data to {output_path}")
            return True
            
        except Exception as e:
            logging.error(f"Failed to process Terms of Lending: {str(e)}")
            return False
    
    def process_call_reports(self, filepath):
        """Process Commercial Bank Call Report Data Excel file"""
        try:
            logging.info("Processing Call Report data...")
            
            # Read Excel file
            df_data = pd.read_excel(filepath, sheet_name='Data')
            df_desc = pd.read_excel(filepath, sheet_name='Descriptions')
            
            # Process data
            data_json = {
                'metadata': {
                    'source': 'Federal Reserve Commercial Bank Call Reports',
                    'updated': datetime.now().strftime('%Y-%m-%d'),
                    'frequency': 'Quarterly'
                },
                'series': {},
                'descriptions': {}
            }
            
            # Process each series
            for col in df_data.columns[1:]:  # Skip date column
                if col in df_desc['Statistic Identifier'].values:
                    desc_row = df_desc[df_desc['Statistic Identifier'] == col].iloc[0]
                    
                    # Store series data
                    series_data = []
                    for idx, row in df_data.iterrows():
                        value = row[col]
                        if pd.notna(value) and str(value).strip() not in ['---', '--- ']:
                            series_data.append({
                                'date': row['Date'],
                                'value': float(value)
                            })
                    
                    data_json['series'][col] = series_data
                    
                    # Store description
                    data_json['descriptions'][col] = {
                        'statistic': desc_row['Statistic '],
                        'description': desc_row['Description '],
                        'unit': desc_row['Unit'],
                        'frequency': desc_row['Frequency '],
                        'definition': desc_row.get('Definition', '')
                    }
            
            # Calculate summary statistics
            data_json['summary'] = self.calculate_summary_stats(data_json['series'])
            
            # Save to JSON
            output_path = self.data_path / 'call-reports.json'
            with open(output_path, 'w') as f:
                json.dump(data_json, f, indent=2)
            
            logging.info(f"Saved processed data to {output_path}")
            return True
            
        except Exception as e:
            logging.error(f"Failed to process Call Reports: {str(e)}")
            return False
    
    def calculate_summary_stats(self, series_dict):
        """Calculate summary statistics for all series"""
        summary = {}
        
        for series_id, data_points in series_dict.items():
            if data_points:
                values = [d['value'] for d in data_points if d['value'] is not None]
                if values:
                    summary[series_id] = {
                        'count': len(values),
                        'mean': round(sum(values) / len(values), 2),
                        'min': round(min(values), 2),
                        'max': round(max(values), 2),
                        'latest': values[-1] if values else None,
                        'latest_date': data_points[-1]['date'] if data_points else None
                    }
        
        return summary
    
    def update_metadata_file(self):
        """Update metadata file with latest update information"""
        self.update_metadata['last_update'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Calculate current quarter
        current_quarter = (datetime.now().month - 1) // 3 + 1
        current_year = datetime.now().year
        self.update_metadata['data_through'] = f"Q{current_quarter} {current_year}"
        
        # Calculate next quarter
        next_quarter = current_quarter + 1 if current_quarter < 4 else 1
        next_year = current_year if current_quarter < 4 else current_year + 1
        self.update_metadata['next_update'] = f"Q{next_quarter} {next_year}"
        
        # Save metadata to file
        metadata_path = self.data_path / 'update_metadata.json'
        with open(metadata_path, 'w') as f:
            json.dump(self.update_metadata, f, indent=2)
        
        logging.info(f"Updated metadata: {self.update_metadata}")
    
    def run_update(self, use_local=False):
        """Main update process"""
        logging.info("=" * 50)
        logging.info("Starting Agricultural Data Update Process")
        logging.info("=" * 50)
        
        success_count = 0
        
        for key, source in self.data_sources.items():
            filepath = self.raw_path / source['filename']
            
            # Download or use local file
            if use_local:
                logging.info(f"Using local file: {filepath}")
                if not filepath.exists():
                    logging.error(f"Local file not found: {filepath}")
                    continue
            else:
                # Download the file
                if not self.download_file(source['url'], filepath):
                    logging.warning(f"Skipping {source['name']} due to download failure")
                    continue
            
            # Process based on data type
            if key == 'district_surveys':
                if self.process_district_surveys(filepath):
                    success_count += 1
            elif key == 'lending_terms':
                if self.process_lending_terms(filepath):
                    success_count += 1
            elif key == 'call_reports':
                if self.process_call_reports(filepath):
                    success_count += 1
        
        # Update metadata
        self.update_metadata['status'] = 'success' if success_count == 3 else 'partial'
        self.update_metadata_file()
        
        logging.info("=" * 50)
        logging.info(f"Update Complete: {success_count}/3 datasets processed successfully")
        logging.info("=" * 50)
        
        return success_count == 3

def main():
    """Main execution function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Update Agricultural Economy Dashboard Data')
    parser.add_argument('--use-local', action='store_true', 
                       help='Use local Excel files instead of downloading')
    parser.add_argument('--path', default='ag-economy-dashboard',
                       help='Path to dashboard directory')
    
    args = parser.parse_args()
    
    # Create updater instance
    updater = AgDataUpdater(base_path=args.path)
    
    # Run update
    success = updater.run_update(use_local=args.use_local)
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()