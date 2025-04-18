import { useState } from 'react';
import arabicToGermanData from '../translations.json'; // استيراد البيانات من ملف JSON

// إنشاء قاموس معكوس من الألمانية إلى العربية
const germanToArabicData = Object.entries(arabicToGermanData).reduce((acc, [key, value]) => {
  acc[value] = key;
  return acc;
}, {});

export default function TranslatorApp() {
  const [arabicText, setArabicText] = useState('');
  const [germanText, setGermanText] = useState('');
  const [translationDirection, setTranslationDirection] = useState('ar-de');
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [showDictionary, setShowDictionary] = useState(false);
  
  // تأخير للترجمة لتجنب الكثير من التحديثات
  const [translationTimeout, setTranslationTimeout] = useState(null);
  
  // دالة مساعدة لإضافة الترجمات للتاريخ
  const addToHistory = (source, target, sourceLanguage, targetLanguage) => {
    const newHistoryItem = {
      source: source,
      target: target,
      direction: `${sourceLanguage}-${targetLanguage}`,
      timestamp: new Date().toLocaleTimeString()
    };
    setHistory(prev => [newHistoryItem, ...prev.slice(0, 9)]);
  };
  
  // دالة الترجمة باستخدام ملفات JSON - تم تحسينها لتكون غير حساسة لحالة الأحرف
  const translateText = (text, sourceLanguage, targetLanguage) => {
    if (!text.trim()) return '';
    
    // تحديد القاموس المناسب
    const dictionary = sourceLanguage === 'ar' ? arabicToGermanData : germanToArabicData;
    
    // للنصوص الألمانية: تحويل أول حرف لحرف كبير والباقي صغير إذا كانت الكلمة موجودة
    if (sourceLanguage === 'de') {
      const normalizedText = text.toLowerCase();
      const capitalizedText = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
      
      // البحث عن النص بعدة أشكال
      if (dictionary[text]) { // كما هو
        addToHistory(text, dictionary[text], sourceLanguage, targetLanguage);
        return dictionary[text];
      } else if (dictionary[capitalizedText]) { // بحرف كبير في البداية
        addToHistory(text, dictionary[capitalizedText], sourceLanguage, targetLanguage);
        return dictionary[capitalizedText];
      } else if (dictionary[normalizedText]) { // كلها أحرف صغيرة
        addToHistory(text, dictionary[normalizedText], sourceLanguage, targetLanguage);
        return dictionary[normalizedText];
      }
    } else {
      // للنصوص العربية: بحث مباشر
      if (dictionary[text]) {
        addToHistory(text, dictionary[text], sourceLanguage, targetLanguage);
        return dictionary[text];
      }
    }
    
    // تقسيم النص إلى كلمات ومحاولة ترجمة كل كلمة
    const words = text.split(' ');
    const translatedWords = words.map(word => {
      if (sourceLanguage === 'de') {
        const normalizedWord = word.toLowerCase();
        const capitalizedWord = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        
        return dictionary[word] || dictionary[capitalizedWord] || dictionary[normalizedWord] || word;
      } else {
        return dictionary[word] || word;
      }
    });
    
    return translatedWords.join(' ');
  };
  
  // بحث عن اقتراحات أثناء الكتابة - تم تحسينها لتكون غير حساسة لحالة الأحرف
  const findSuggestions = (text, language) => {
    if (!text.trim()) {
      setSuggestions([]);
      return;
    }
    
    const dictionary = language === 'ar' ? arabicToGermanData : germanToArabicData;
    
    if (language === 'de') {
      const normalizedText = text.toLowerCase();
      // تجميع الاقتراحات من البحث بأشكال مختلفة
      const suggestionList = Object.keys(dictionary).filter(word => 
        word.toLowerCase().startsWith(normalizedText)
      ).slice(0, 5);
      
      setSuggestions(suggestionList);
    } else {
      // للعربية: بحث عادي
      const suggestionList = Object.keys(dictionary)
        .filter(word => word.startsWith(text))
        .slice(0, 5);
        
      setSuggestions(suggestionList);
    }
  };
  
  // دالة معالجة تغيير النص العربي
  const handleArabicChange = (value) => {
    setArabicText(value);
    
    if (translationDirection === 'ar-de') {
      findSuggestions(value, 'ar');
      
      // إلغاء أي طلب ترجمة سابق
      if (translationTimeout) clearTimeout(translationTimeout);
      
      // انتظار توقف المستخدم عن الكتابة
      const timeout = setTimeout(() => {
        if (value.trim()) {
          const translated = translateText(value, 'ar', 'de');
          setGermanText(translated);
        } else {
          setGermanText('');
        }
      }, 300);
      
      setTranslationTimeout(timeout);
    }
  };
  
  // دالة معالجة تغيير النص الألماني
  const handleGermanChange = (value) => {
    setGermanText(value);
    
    if (translationDirection === 'de-ar') {
      findSuggestions(value, 'de');
      
      if (translationTimeout) clearTimeout(translationTimeout);
      
      const timeout = setTimeout(() => {
        if (value.trim()) {
          const translated = translateText(value, 'de', 'ar');
          setArabicText(translated);
        } else {
          setArabicText('');
        }
      }, 300);
      
      setTranslationTimeout(timeout);
    }
  };
  
  // تبديل اتجاه الترجمة
  const toggleDirection = () => {
    const newDirection = translationDirection === 'ar-de' ? 'de-ar' : 'ar-de';
    setTranslationDirection(newDirection);
    setArabicText('');
    setGermanText('');
    setSuggestions([]);
  };
  
  // اختيار اقتراح
  const selectSuggestion = (suggestion) => {
    if (translationDirection === 'ar-de') {
      setArabicText(suggestion);
      const translated = translateText(suggestion, 'ar', 'de');
      setGermanText(translated);
    } else {
      setGermanText(suggestion);
      const translated = translateText(suggestion, 'de', 'ar');
      setArabicText(translated);
    }
    setSuggestions([]);
  };
  
  // اختيار عنصر من التاريخ
  const selectHistoryItem = (item) => {
    if (item.direction === 'ar-de') {
      setTranslationDirection('ar-de');
      setArabicText(item.source);
      setGermanText(item.target);
    } else {
      setTranslationDirection('de-ar');
      setGermanText(item.source);
      setArabicText(item.target);
    }
  };

  return (
    <div className="flex flex-col items-center p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">مترجم العربية-الألمانية</h1>
      
      <div className="flex flex-col w-full space-y-4">
        {/* أزرار تبديل اتجاه الترجمة */}
        <div className="flex justify-center mb-2">
          <button 
            onClick={toggleDirection}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg flex items-center"
          >
            {translationDirection === 'ar-de' ? 
              'من العربية إلى الألمانية' : 
              'من الألمانية إلى العربية'
            }
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
          
          <button 
            onClick={() => setShowDictionary(!showDictionary)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg ml-2"
          >
            {showDictionary ? 'إخفاء القاموس' : 'عرض القاموس'}
          </button>
        </div>
        
        {/* حقول الإدخال */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* مكان إدخال النص المصدر */}
          <div className="flex flex-col">
            <label className="mb-2 font-medium" dir="rtl">
              {translationDirection === 'ar-de' ? 'النص العربي' : 'النص الألماني'}
            </label>
            <textarea
              dir={translationDirection === 'ar-de' ? "rtl" : "ltr"}
              value={translationDirection === 'ar-de' ? arabicText : germanText}
              onChange={(e) => translationDirection === 'ar-de' ? 
                handleArabicChange(e.target.value) : 
                handleGermanChange(e.target.value)
              }
              className="border border-gray-300 rounded-lg p-3 h-40 font-arabic"
              placeholder={translationDirection === 'ar-de' ? 
                'أدخل النص بالعربية هنا...' : 
                'Geben Sie hier deutschen Text ein...'
              }
            />
          </div>
          
          {/* مكان عرض الترجمة - غير قابل للكتابة وبلون مختلف */}
          <div className="flex flex-col">
            <label className="mb-2 font-medium">
              {translationDirection === 'ar-de' ? 'الترجمة الألمانية' : 'الترجمة العربية'}
            </label>
            <textarea
              dir={translationDirection === 'ar-de' ? "ltr" : "rtl"}
              value={translationDirection === 'ar-de' ? germanText : arabicText}
              readOnly
              className="border border-gray-300 rounded-lg p-3 h-40 bg-gray-100"
              placeholder={translationDirection === 'ar-de' ? 
                'Die Übersetzung wird hier angezeigt...' : 
                'ستظهر الترجمة هنا...'
              }
            />
          </div>
        </div>
        
        {/* الاقتراحات */}
        {suggestions.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-gray-600 mb-1">اقتراحات:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => selectSuggestion(suggestion)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* عرض القاموس - تم تحسين شكل الجدول */}
        {showDictionary && (
          <div className="mt-4 border rounded-lg p-4 bg-gray-50">
            <h3 className="font-medium mb-2">القاموس ({Object.keys(arabicToGermanData).length} كلمة)</h3>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-500 text-white">
                    <th className="py-2 px-3 text-right">الكلمة العربية</th>
                    <th className="py-2 px-3 text-center" style={{ width: '40px' }}></th>
                    <th className="py-2 px-3 text-left">الترجمة الألمانية</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(arabicToGermanData).map(([ar, de], index) => (
                    <tr 
                      key={index} 
                      className={`${index % 2 === 0 ? "bg-white" : "bg-gray-100"} hover:bg-blue-50 cursor-pointer`}
                      onClick={() => {
                        if (translationDirection === 'ar-de') {
                          setArabicText(ar);
                          setGermanText(de);
                        } else {
                          setGermanText(de);
                          setArabicText(ar);
                        }
                      }}
                    >
                      <td dir="rtl" className="py-2 px-3 text-right font-medium text-blue-700">{ar}</td>
                      <td className="py-2 px-3 text-center">→</td>
                      <td className="py-2 px-3 text-left font-medium text-green-700">{de}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* سجل الترجمات */}
        {history.length > 0 && (
          <div className="mt-4 border rounded-lg p-4">
            <h3 className="font-medium mb-2">سجل الترجمات الأخيرة</h3>
            <div className="space-y-2">
              {history.map((item, index) => (
                <div 
                  key={index} 
                  className="flex justify-between items-center bg-gray-100 p-2 rounded-md hover:bg-gray-200 cursor-pointer"
                  onClick={() => selectHistoryItem(item)}
                >
                  <div className="flex flex-col">
                    <div className="flex space-x-2">
                      <span dir={item.direction.startsWith('ar') ? 'rtl' : 'ltr'}>
                        {item.source}
                      </span>
                      <span>→</span>
                      <span dir={item.direction.startsWith('de') ? 'rtl' : 'ltr'}>
                        {item.target}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{item.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-8 p-4 border rounded-lg bg-gray-50 w-full">
        <h2 className="text-lg font-medium mb-2">ملاحظات:</h2>
        <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
          <li>هذا التطبيق يعتمد على قاموس محدود من الكلمات</li>
          <li>يمكنك إضافة المزيد من الكلمات عن طريق تعديل ملفات JSON</li>
          <li>تتم الترجمة محلياً دون الحاجة إلى اتصال بالإنترنت</li>
        </ul>
      </div>
    </div>
  );
}