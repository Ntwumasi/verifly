import axios from 'axios';
import { config } from '../../config';

export class PEPService {
  private readonly baseURL = 'https://api.pep-data.com/v1'; // Example API

  async checkPEP(applicant: any): Promise<any> {
    try {
      const searchTerms = {
        first_name: applicant.first_name,
        last_name: applicant.last_name,
        middle_name: applicant.middle_name,
        date_of_birth: applicant.date_of_birth,
        nationality: applicant.nationality,
      };

      // For MVP, we'll simulate API calls with mock data
      const mockResults = await this.mockPEPCheck(searchTerms);
      
      return {
        source: 'pep',
        checked_at: new Date(),
        query_terms: searchTerms,
        hits: mockResults.hits,
        total_hits: mockResults.hits.length,
        confidence_threshold: 70,
        api_status: 'success',
      };

    } catch (error) {
      console.error('PEP check failed:', error);
      throw error;
    }
  }

  private async mockPEPCheck(searchTerms: any): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const hits = [];

    // Simulate PEP hits based on common political names
    const pepNames = [
      { name: 'emmanuel macron', position: 'President', country: 'France' },
      { name: 'angela merkel', position: 'Former Chancellor', country: 'Germany' },
      { name: 'joe biden', position: 'President', country: 'United States' },
      { name: 'boris johnson', position: 'Former Prime Minister', country: 'United Kingdom' },
      { name: 'xi jinping', position: 'President', country: 'China' },
    ];

    const fullName = `${searchTerms.first_name} ${searchTerms.last_name}`.toLowerCase();

    for (const pep of pepNames) {
      const confidence = this.calculateNameSimilarity(fullName, pep.name);
      
      if (confidence > 50) {
        hits.push({
          source_type: 'pep_database',
          match_confidence: confidence,
          match_type: confidence > 90 ? 'exact' : 'fuzzy',
          record_data: {
            name: pep.name.toUpperCase(),
            current_position: pep.position,
            country: pep.country,
            category: 'Head of State',
            risk_level: confidence > 85 ? 'High' : 'Medium',
            last_updated: '2024-01-01',
          },
          query_terms: searchTerms,
          jurisdiction: pep.country,
          severity: confidence > 85 ? 'high' : 'medium',
          record_date: new Date('2024-01-01'),
          metadata: {
            pep_category: 'Head of State',
            political_exposure: 'Direct',
            source_reliability: 'High',
          },
        });
      }
    }

    // Also check family/associates with lower confidence
    if (hits.length === 0) {
      const familyNames = ['smith', 'johnson', 'brown', 'davis', 'miller'];
      const lastName = searchTerms.last_name.toLowerCase();
      
      if (familyNames.includes(lastName)) {
        hits.push({
          source_type: 'pep_associates',
          match_confidence: 40,
          match_type: 'fuzzy',
          record_data: {
            name: `${searchTerms.first_name} ${searchTerms.last_name}`.toUpperCase(),
            relationship: 'Possible family member',
            associated_pep: 'John Smith (Minister)',
            country: searchTerms.nationality,
            risk_level: 'Low',
          },
          query_terms: searchTerms,
          jurisdiction: searchTerms.nationality,
          severity: 'low',
          record_date: new Date(),
          metadata: {
            pep_category: 'Associate',
            political_exposure: 'Indirect',
            confidence_note: 'Common surname match',
          },
        });
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
  private async realPEPAPI(searchTerms: any): Promise<any> {
    if (!config.apis.pepApiKey) {
      throw new Error('PEP API key not configured');
    }

    const response = await axios.post(`${this.baseURL}/search`, {
      name: `${searchTerms.first_name} ${searchTerms.last_name}`,
      date_of_birth: searchTerms.date_of_birth,
      nationality: searchTerms.nationality,
      include_associates: true,
      include_family: true,
      confidence_threshold: 50,
    }, {
      headers: {
        'Authorization': `Bearer ${config.apis.pepApiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    return response.data;
  }
}