import { useMemo } from 'react'

const BOLLYWOOD_QUOTES = [
  { quote: 'यारा सिल्ली डे…', movie: 'Yaaraa Silly De', english: 'Friends forever...' },
  { quote: 'हम दोनों मिल कर अमर हो जाएंगे', movie: 'Sholay', english: 'Together we shall be immortal' },
  { quote: 'सैनिया, मेरे सपनों में तुम आती हो', movie: 'Maine Pyar Kiya', english: 'Saunya, you come in my dreams' },
  { quote: 'यह दुनिया है कंचन की…', movie: 'Anupama', english: 'This world is made of riches...' },
  { quote: 'चल दिल्ली चलें', movie: 'Chale Dilli', english: 'Let\'s go to Delhi' },
  { quote: 'कुछ कहना है मुझे तुम्हें', movie: 'Kuch Kah Na Hai', english: 'I have something to tell you' },
  { quote: 'प्यार करने की उमर नहीं होती', movie: 'Kareeb', english: 'There is no age for love' },
  { quote: 'तुम्हारी यादों में खो गया हूं मैं', movie: 'Aashqui', english: 'I am lost in your memories' },
  { quote: 'बॉलीवुड का जादू कभी नहीं टूटता', movie: 'Phantom', english: 'Bollywood\'s magic never ends' },
  { quote: 'सिनेमा ही हमारी आसमान है', movie: 'Cinema Walas', english: 'Cinema is our sky' },
  { quote: 'खुशी के पल कभी नहीं भूलते', movie: 'Jab We Met', english: 'Moments of joy are never forgotten' },
  { quote: 'आ, खुद को छोड़ दे…', movie: 'Kal Ho Naa Ho', english: 'Let go of yourself...' },
  { quote: 'स्क्रीन पर जादू होता है', movie: 'The Traveling Cinemas', english: 'Magic happens on screen' },
  { quote: 'हर फिल्म एक नई कहानी', movie: 'Cinephile', english: 'Every film is a new story' },
  { quote: 'यह पिटारा हमारा घर है', movie: 'PITARA', english: 'This box is our home' },
  { quote: 'सपनों की भाषा सिनेमा है', movie: 'Daydreaming', english: 'Cinema is the language of dreams' },
  { quote: 'एक बार फिर से देखता हूं अपने सपनों को', movie: 'Retrospective', english: 'I see my dreams once more' },
  { quote: 'पर्दे के पीछे जादू है', movie: 'Behind the Screen', english: 'There\'s magic behind the screen' },
]

export function useRandomQuote() {
  return useMemo(() => {
    const quote = BOLLYWOOD_QUOTES[Math.floor(Math.random() * BOLLYWOOD_QUOTES.length)]
    return quote
  }, [])
}

export function getRandomQuote() {
  return BOLLYWOOD_QUOTES[Math.floor(Math.random() * BOLLYWOOD_QUOTES.length)]
}
