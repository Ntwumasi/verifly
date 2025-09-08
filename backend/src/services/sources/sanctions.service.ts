import axios from 'axios';
import { config } from '../../config';

export class SanctionsService {
  private readonly baseURL = 'https://api.sanctions-data.com/v1'; // Example API

  async checkSanctions(applicant: any): Promise<any> {
    try {
      // Prepare search terms
      const searchTerms = {
        first_name: applicant.first_name,
        last_name: applicant.last_name,
        middle_name: applicant.middle_name,
        date_of_birth: applicant.date_of_birth,
        nationality: applicant.nationality,
        passport_number: applicant.passport_number,
      };

      // For MVP, we'll simulate API calls with mock data
      // In production, you would replace this with actual API calls
      const mockResults = await this.mockSanctionsCheck(searchTerms);
      
      return {
        source: 'sanctions',
        checked_at: new Date(),
        query_terms: searchTerms,
        hits: mockResults.hits,
        total_hits: mockResults.hits.length,
        confidence_threshold: 70,
        api_status: 'success',
      };

    } catch (error) {
      console.error('Sanctions check failed:', error);
      throw error;
    }
  }

  private async mockSanctionsCheck(searchTerms: any): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const hits = [];

    // Simulate hits based on common test names
    const testNames = ['john smith', 'jane doe', 'vladimir putin', 'kim jong'];
    const fullName = `${searchTerms.first_name} ${searchTerms.last_name}`.toLowerCase();

    for (const testName of testNames) {
      if (fullName.includes(testName.split(' ')[0]) || fullName.includes(testName.split(' ')[1])) {
        const confidence = this.calculateNameSimilarity(fullName, testName);
        
        if (confidence > 60) {
          hits.push({
            source_type: 'sanctions_list',
            match_confidence: confidence,
            match_type: confidence > 90 ? 'exact' : 'fuzzy',
            record_data: {
              name: testName.toUpperCase(),
              list_name: 'OFAC SDN List',
              date_added: '2020-01-15',
              reason: 'Narcotics trafficking',
              country: 'Unknown',
            },
            query_terms: searchTerms,
            record_url: 'https://sanctionslist.ofac.treas.gov/',
            jurisdiction: 'US',
            severity: confidence > 90 ? 'high' : confidence > 80 ? 'medium' : 'low',
            record_date: new Date('2020-01-15'),
            metadata: {
              list_type: 'SDN',
              program: 'NARCOTICS',
              entity_type: 'Individual',
            },
          });
        }
      }
    }

    return { hits };
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    // Simple Levenshtein distance-based similarity
    const longer = name1.length > name2.length ? name1 : name2;
    const shorter = name1.length > name2.length ? name2 : name1;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    
    if (longer.length === 0) {
      return 100;
    }
    
    return Math.round(((longer.length - editDistance) / longer.length) * 100);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Real API implementation template
  private async realSanctionsAPI(searchTerms: any): Promise<any> {
    if (!config.apis.sanctionsApiKey) {
      throw new Error('Sanctions API key not configured');
    }

    const response = await axios.post(`${this.baseURL}/search`, {
      names: [`${searchTerms.first_name} ${searchTerms.last_name}`],
      date_of_birth: searchTerms.date_of_birth,
      nationality: searchTerms.nationality,
      fuzzy_matching: true,
      confidence_threshold: 70,
    }, {
      headers: {
        'Authorization': `Bearer ${config.apis.sanctionsApiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    return response.data;
  }
}