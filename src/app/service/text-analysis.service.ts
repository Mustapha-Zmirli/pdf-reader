import { Injectable } from '@angular/core';
import { ActionCategory, TextAnalysisResult } from '../components/pdf-reader/pdf-reader.types';

@Injectable({
  providedIn: 'root'
})
export class TextAnalysisService {
  
  private readonly predefinedCategories: ActionCategory[] = [
    {
      id: 'academic',
      label: 'Académique',
      icon: 'pi pi-book',
      color: '#3b82f6',
      description: 'Contenu éducatif, recherche, citations'
    },
    {
      id: 'technical',
      label: 'Technique',
      icon: 'pi pi-cog',
      color: '#8b5cf6',
      description: 'Termes techniques, code, spécifications'
    },
    {
      id: 'business',
      label: 'Business',
      icon: 'pi pi-briefcase',
      color: '#10b981',
      description: 'Finance, management, stratégie'
    },
    {
      id: 'legal',
      label: 'Juridique',
      icon: 'pi pi-shield',
      color: '#f59e0b',
      description: 'Lois, contrats, réglementations'
    },
    {
      id: 'medical',
      label: 'Médical',
      icon: 'pi pi-heart',
      color: '#ef4444',
      description: 'Santé, médecine, symptômes'
    },
    {
      id: 'general',
      label: 'Général',
      icon: 'pi pi-file-o',
      color: '#6b7280',
      description: 'Contenu général'
    }
  ];

  private readonly academicKeywords = [
    'recherche', 'étude', 'analyse', 'théorie', 'hypothèse', 'conclusion',
    'bibliographie', 'citation', 'référence', 'université', 'doctorat',
    'thèse', 'article', 'publication', 'scientifique', 'académique',
    'model', 'accuracy', 'validation', 'training', 'testing', 'samples',
    'performance', 'evaluation', 'cross-validation', 'regression', 'logistic'
  ];

  private readonly technicalKeywords = [
    'algorithme', 'fonction', 'variable', 'code', 'programme', 'logiciel',
    'système', 'réseau', 'base de données', 'serveur', 'API', 'framework',
    'développement', 'architecture', 'configuration', 'paramètre',
    'algorithm', 'function', 'variable', 'code', 'program', 'software',
    'system', 'network', 'database', 'server', 'development'
  ];

  private readonly businessKeywords = [
    'entreprise', 'société', 'marché', 'client', 'vente', 'marketing',
    'stratégie', 'profit', 'revenus', 'investissement', 'budget',
    'économie', 'finance', 'comptabilité', 'management', 'équipe'
  ];

  private readonly legalKeywords = [
    'loi', 'article', 'contrat', 'clause', 'juridique', 'tribunal',
    'avocat', 'juge', 'procédure', 'droit', 'réglementation',
    'conformité', 'responsabilité', 'obligation', 'accord'
  ];

  private readonly medicalKeywords = [
    'patient', 'médecin', 'traitement', 'diagnostic', 'symptôme',
    'maladie', 'thérapie', 'médicament', 'santé', 'hôpital',
    'clinique', 'examen', 'analyse', 'prescription', 'chirurgie'
  ];

  async analyzeText(text: string): Promise<TextAnalysisResult> {
    console.log('🔬 TextAnalysisService: Starting analysis for text:', text.substring(0, 100) + '...');
    
    // Simulate API call delay for realistic experience
    await new Promise(resolve => setTimeout(resolve, 300));

    const normalizedText = text.toLowerCase();
    const words = text.trim().split(/\s+/);
    const keywords = this.extractKeywords(normalizedText);
    const categories = this.categorizeText(normalizedText, keywords);
    
    const result: TextAnalysisResult = {
      categories,
      keywords,
      language: this.detectLanguage(text),
      wordCount: words.length,
      charCount: text.length,
      sentiment: this.analyzeSentiment(normalizedText)
    };

    console.log('📊 TextAnalysisService: Analysis completed:', {
      categoriesFound: result.categories.length,
      categoryNames: result.categories.map(c => c.label),
      keywordsFound: result.keywords.length,
      keywords: result.keywords,
      language: result.language,
      sentiment: result.sentiment,
      wordCount: result.wordCount
    });
    
    return result;
  }

  private extractKeywords(text: string): string[] {
    const allKeywords = [
      ...this.academicKeywords,
      ...this.technicalKeywords,
      ...this.businessKeywords,
      ...this.legalKeywords,
      ...this.medicalKeywords
    ];

    const foundKeywords = allKeywords.filter(keyword => 
      text.includes(keyword.toLowerCase())
    ).slice(0, 10); // Limit to top 10 keywords

    console.log('🔍 Keywords extracted:', foundKeywords);
    return foundKeywords;
  }

  private categorizeText(text: string, keywords: string[]): ActionCategory[] {
    const categoryScores = new Map<string, number>();

    // Initialize scores
    this.predefinedCategories.forEach(cat => {
      categoryScores.set(cat.id, 0);
    });

    // Score based on keywords
    keywords.forEach(keyword => {
      if (this.academicKeywords.includes(keyword)) {
        categoryScores.set('academic', (categoryScores.get('academic') || 0) + 1);
      }
      if (this.technicalKeywords.includes(keyword)) {
        categoryScores.set('technical', (categoryScores.get('technical') || 0) + 1);
      }
      if (this.businessKeywords.includes(keyword)) {
        categoryScores.set('business', (categoryScores.get('business') || 0) + 1);
      }
      if (this.legalKeywords.includes(keyword)) {
        categoryScores.set('legal', (categoryScores.get('legal') || 0) + 1);
      }
      if (this.medicalKeywords.includes(keyword)) {
        categoryScores.set('medical', (categoryScores.get('medical') || 0) + 1);
      }
    });

    console.log('📈 Category scores:', Array.from(categoryScores.entries()));

    // Sort categories by score and return top matches
    const sortedCategories = Array.from(categoryScores.entries())
      .sort(([,a], [,b]) => b - a)
      .filter(([,score]) => score > 0)
      .map(([categoryId]) => 
        this.predefinedCategories.find(cat => cat.id === categoryId)!
      );

    // Always include general category if no specific categories found
    if (sortedCategories.length === 0) {
      console.log('📂 No specific categories found, using general');
      sortedCategories.push(
        this.predefinedCategories.find(cat => cat.id === 'general')!
      );
    }

    const finalCategories = sortedCategories.slice(0, 3); // Return top 3 categories
    console.log('🏷️ Final categories:', finalCategories.map(c => c.label));
    
    return finalCategories;
  }

  private detectLanguage(text: string): string {
    // Simple language detection - enhanced
    const frenchWords = ['le', 'la', 'les', 'de', 'du', 'des', 'et', 'à', 'un', 'une', 'pour', 'avec', 'sur'];
    const englishWords = ['the', 'and', 'or', 'of', 'to', 'a', 'an', 'in', 'on', 'at', 'for', 'with'];
    
    const normalizedText = text.toLowerCase();
    const frenchScore = frenchWords.reduce((score, word) => 
      score + (normalizedText.split(word).length - 1), 0);
    const englishScore = englishWords.reduce((score, word) => 
      score + (normalizedText.split(word).length - 1), 0);
    
    const language = frenchScore > englishScore ? 'fr' : 'en';
    console.log('🌍 Language detection:', { frenchScore, englishScore, detected: language });
    
    return language;
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    // Enhanced sentiment analysis
    const positiveWords = ['bon', 'bien', 'excellent', 'parfait', 'super', 'génial', 'formidable', 'good', 'excellent', 'great', 'perfect', 'amazing'];
    const negativeWords = ['mauvais', 'mal', 'terrible', 'horrible', 'nul', 'problème', 'erreur', 'bad', 'terrible', 'horrible', 'problem', 'error'];
    
    const positiveScore = positiveWords.reduce((score, word) => 
      score + (text.split(word).length - 1), 0);
    const negativeScore = negativeWords.reduce((score, word) => 
      score + (text.split(word).length - 1), 0);
    
    let sentiment: 'positive' | 'negative' | 'neutral';
    if (positiveScore > negativeScore) sentiment = 'positive';
    else if (negativeScore > positiveScore) sentiment = 'negative';
    else sentiment = 'neutral';
    
    console.log('😊 Sentiment analysis:', { positiveScore, negativeScore, sentiment });
    
    return sentiment;
  }

  getCategoryById(categoryId: string): ActionCategory | undefined {
    return this.predefinedCategories.find(cat => cat.id === categoryId);
  }

  getAllCategories(): ActionCategory[] {
    return [...this.predefinedCategories];
  }
}