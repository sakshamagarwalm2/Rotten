import React from 'react';

type PreviewProps = {
  backgroundImage: string | null;
  fontSize: number;
  headingFontSize: number;
  lineSpacing: number;
  horizontalMargin: number;
  verticalMargin: number;
  questionNoOptionNoColor: string;
  questionOptionColor: string;
  yearColor: string;
  answerColor: string;
  showAnswer: boolean;
  showBulletPoints: boolean;
  bulletStyle: 'disc' | 'circle' | 'square' | 'number' | 'letters' | 'none';
};

export default function Preview({ 
  backgroundImage, 
  fontSize, 
  headingFontSize,
  lineSpacing,
  horizontalMargin,
  verticalMargin,
  questionNoOptionNoColor,
  questionOptionColor,
  yearColor,
  answerColor,
  showAnswer,
  showBulletPoints,
  bulletStyle
}: PreviewProps) {
  // Scale margins for preview (assuming input is in inches or similar scale)
  const leftPadding = horizontalMargin * 64; 
  const topPadding = verticalMargin * 64;

  const getBulletPrefix = (index: number) => {
    if (!showBulletPoints || bulletStyle === 'none') return '';
    
    switch (bulletStyle) {
      case 'disc': return '●';
      case 'circle': return '○';
      case 'square': return '■';
      case 'number': return `${index + 1}.`;
      case 'letters': return `${String.fromCharCode(65 + index)}.`;
      default: return '';
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* Slide Card */}
      <div className="flex flex-1 items-center justify-center rounded-xl bg-[#f8f9fa]">
        
        {/* Slide */}
        <div className="relative w-full max-w-4xl" style={{ aspectRatio: '16/9' }}>
          <div className="absolute inset-0 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-lg" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            
            {/* Background */}
            {backgroundImage ? (
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${backgroundImage})` }}
              />
            ) : (
              <div className="absolute inset-0 bg-[#f5f5f5]"></div>
            )}
            
            {/* Content Container with dynamic margins */}
            <div 
              className="absolute inset-0 flex flex-col overflow-hidden break-words"
              style={{ 
                paddingLeft: `${leftPadding}px`,
                paddingRight: `${leftPadding}px`,
                paddingTop: `${topPadding}px`,
                paddingBottom: `${topPadding}px`
              }}
            >
               
              {/* Question & Year Tag Container */}
              <div className="mb-6 min-w-0">
                <div className="flex flex-wrap items-baseline gap-3">
                  <h3 
                    className="font-semibold break-words" 
                    style={{ 
                      fontSize: `${headingFontSize}px`,
                      lineHeight: lineSpacing,
                    }}
                  >
                    <span style={{ color: questionNoOptionNoColor }}>प्रश्न 1. </span>
                    <span style={{ color: questionOptionColor }}>निम्नलिखित में से कौन सा शहर गंगा नदी के तट पर स्थित नहीं है?</span>
                  </h3>
                  <span 
                    className="inline-block rounded-full px-3 py-1 font-semibold text-white whitespace-nowrap"
                    style={{ 
                      backgroundColor: yearColor,
                      fontSize: `${headingFontSize * 0.6}px`, // Scaled relative to question size
                      lineHeight: '1'
                    }}
                  >
                    2023
                  </span>
                </div>
              </div>

              {/* Options */}
              <div className="min-w-0" style={{ fontSize: `${fontSize}px` }}>
                <div className="space-y-3">
                  {[
                    { label: 'कानपुर', isCorrect: false },
                    { label: 'पटना', isCorrect: false },
                    { label: 'वाराणसी', isCorrect: false },
                    { label: 'लखनऊ', isCorrect: true }
                  ].map((option, idx) => {
                    const isCorrectAnswer = option.isCorrect && showAnswer;
                    return (
                      <div 
                        key={idx}
                        className={`flex items-start gap-3 rounded-lg px-3 py-2 min-w-0`}
                        style={isCorrectAnswer ? { 
                          backgroundColor: `${answerColor}15`, 
                          color: answerColor 
                        } : {}}
                      >
                        <span 
                          className={`font-semibold shrink-0`}
                          style={{ color: isCorrectAnswer ? 'inherit' : questionNoOptionNoColor }}
                        >
                          {getBulletPrefix(idx)}
                        </span>
                        <span 
                          className="break-words min-w-0" 
                          style={{ 
                            lineHeight: lineSpacing,
                            color: isCorrectAnswer ? 'inherit' : questionOptionColor
                          }}
                        >
                          {option.label}
                        </span>
                        {isCorrectAnswer && (
                          <span className="ml-auto flex items-center gap-1 text-xs font-medium shrink-0" style={{ color: answerColor }}>
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                            </svg>
                            उत्तर
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
