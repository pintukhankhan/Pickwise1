// First boot with an empty store seeds this. Prices carry a verify note in the admin UI.
const TAG = process.env.AMAZON_TAG || "shoyebkhan192-20";
const dp  = (asin) => `https://www.amazon.com/dp/${asin}?tag=${TAG}`;
const sr  = (q)    => `https://www.amazon.com/s?k=${encodeURIComponent(q)}&tag=${TAG}`;

const SEED = [
  { asin:"B0006H92QK", title:"Audio-Technica AT2020 Cardioid Condenser Microphone", brand:"Audio-Technica", category:"tech", price:104.95, was:149.00, rating:4.8, reviews:12400, image:"https://picsum.photos/seed/at2020-mic/600/400", verdict:"The XLR mic half the internet learned to podcast on — neutral, honest, built like a tank.", tags:["microphone","mic","podcast","streaming","studio","xlr","condenser","audio","creator"], flag:"choice", active:true },
  { asin:"", title:"Blue Yeti USB Microphone", brand:"Blue", category:"tech", price:99.99, was:129.99, rating:4.6, reviews:48000, image:"https://picsum.photos/seed/blue-yeti/600/400", verdict:"Plug in, press record, sound like a pro — the USB mic that made a studio a desk-drawer away.", tags:["microphone","usb mic","podcast","streaming","youtube","audio","creator"], flag:"hot", active:true, _search:"Blue Yeti USB Microphone" },
  { asin:"", title:"Elgato Wave Mic Arm LP", brand:"Elgato", category:"tech", price:79.99, was:99.99, rating:4.7, reviews:5200, image:"https://picsum.photos/seed/mic-arm/600/400", verdict:"A low-profile arm that holds your mic where your mouth is — then quietly disappears.", tags:["mic arm","boom arm","microphone stand","desk mount","streaming","studio","creator"], flag:"value", active:true, _search:"Elgato Wave Mic Arm LP" },
  { asin:"", title:"Focusrite Scarlett Solo Audio Interface", brand:"Focusrite", category:"tech", price:129.00, was:149.00, rating:4.7, reviews:9100, image:"https://picsum.photos/seed/scarlett-solo/600/400", verdict:"The little red box that turns your XLR mic's whisper into a clean, gain-rich signal.", tags:["audio interface","xlr","usb interface","recording","preamp","studio","creator"], flag:"choice", active:true, _search:"Focusrite Scarlett Solo" },
  { asin:"", title:"Audio-Technica ATH-M40x Monitor Headphones", brand:"Audio-Technica", category:"tech", price:99.00, was:119.00, rating:4.6, reviews:14300, image:"https://picsum.photos/seed/monitor-headphones/600/400", verdict:"Flat, unforgiving monitor cans — they tell you the truth about your recording, kindly.", tags:["headphones","monitor headphones","studio","mixing","audio","wired","creator"], flag:null, active:true, _search:"Audio-Technica ATH-M40x" },
  { asin:"", title:"Dual-Layer Pop Filter with Clamp", brand:"Generic", category:"tech", price:12.99, was:19.99, rating:4.5, reviews:21000, image:"https://picsum.photos/seed/pop-filter/600/400", verdict:"Two layers of mesh between you and every plosive — your p's finally stop punching the mic.", tags:["pop filter","microphone accessory","recording","podcast","studio","creator"], flag:"value", active:true, _search:"dual layer pop filter with clamp" },
  { asin:"", title:"Elgato Key Light Air", brand:"Elgato", category:"tech", price:129.99, was:149.99, rating:4.6, reviews:3800, image:"https://picsum.photos/seed/key-light/600/400", verdict:"App-controlled panel light that flatters your face without the ring-light donut in your eyes.", tags:["lighting","key light","streaming light","webcam light","creator","studio"], flag:"hot", active:true, _search:"Elgato Key Light Air" },
  { asin:"", title:"Logitech C920x HD Webcam", brand:"Logitech", category:"tech", price:49.99, was:69.99, rating:4.6, reviews:77000, image:"https://picsum.photos/seed/webcam-c920/600/400", verdict:"The webcam that's been the right answer for a decade — sharp, simple, plug-and-play.", tags:["webcam","camera","streaming","zoom","1080p","creator"], flag:"value", active:true, _search:"Logitech C920x webcam" },
  { asin:"", title:"Studio Acoustic Foam Panels (12-Pack)", brand:"Generic", category:"home", price:22.99, was:32.99, rating:4.4, reviews:18000, image:"https://picsum.photos/seed/acoustic-foam/600/400", verdict:"Kills the bathroom-echo so your voice sounds like a studio, not a stairwell.", tags:["acoustic foam","soundproofing","studio","room treatment","recording","home","creator"], flag:null, active:true, _search:"studio acoustic foam panels 12 pack" },
  { asin:"", title:"Memory-Foam Seat Cushion for Long Sessions", brand:"Generic", category:"fitness", price:29.99, was:39.99, rating:4.5, reviews:9600, image:"https://picsum.photos/seed/seat-cushion/600/400", verdict:"Eight-hour editing marathons stop being a back workout — the unglamorous upgrade you feel daily.", tags:["seat cushion","ergonomic","posture","work from home","comfort","wellness","creator"], flag:"value", active:true, _search:"memory foam seat cushion" },
];

// Build a clean record: real ASIN → /dp/ link, else tagged search link.
module.exports.SEED = SEED.map((p, i) => ({
  id: "seed" + (i + 1),
  asin: p.asin || "",
  title: p.title,
  brand: p.brand || "",
  category: p.category,
  price: p.price,
  was: p.was,
  currency: "USD",
  rating: p.rating,
  reviews: p.reviews || 0,
  image: p.image,
  url: p.asin ? dp(p.asin) : sr(p._search || p.title),
  verdict: p.verdict,
  tags: p.tags,
  flag: p.flag || null,
  active: p.active !== false,
  position: i,
  updatedAt: new Date().toISOString(),
}));
