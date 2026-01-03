/**
 * Merchant Registry - Authoritative, curated merchant database
 * Contains 150+ verified merchants for high-confidence categorization
 */

import { MerchantCategory, Confidence } from './merchantCategories';

export interface MerchantRecord {
  id: string;
  displayName: string;
  domains: string[];
  defaultCategory: MerchantCategory;
  tags?: string[];
  categoryOverrides?: Array<{
    match: { pathIncludes?: string[]; queryIncludes?: string[] };
    category: MerchantCategory;
    confidence: Confidence;
    reason: string;
  }>;
  exclusions?: string[];
  verified: boolean;
  lastVerifiedAt?: string;
  sources?: string[];
}

export const MERCHANT_REGISTRY: MerchantRecord[] = [
  // === GROCERY ===
  { id: 'walmart', displayName: 'Walmart', domains: ['walmart.com'], defaultCategory: 'department_store', tags: ['big-box', 'general'], exclusions: ['grocery-excluded-by-most-cards'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'target', displayName: 'Target', domains: ['target.com'], defaultCategory: 'department_store', tags: ['big-box', 'general'], exclusions: ['grocery-excluded-by-most-cards'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'costco', displayName: 'Costco', domains: ['costco.com'], defaultCategory: 'warehouse_club', tags: ['warehouse', 'membership'], exclusions: ['grocery-excluded', 'warehouse-excluded'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'samsclub', displayName: "Sam's Club", domains: ['samsclub.com'], defaultCategory: 'warehouse_club', tags: ['warehouse', 'membership'], exclusions: ['grocery-excluded', 'warehouse-excluded'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'bjs', displayName: "BJ's Wholesale", domains: ['bjs.com'], defaultCategory: 'warehouse_club', tags: ['warehouse', 'membership'], exclusions: ['grocery-excluded', 'warehouse-excluded'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'wholefoodsmarket', displayName: 'Whole Foods', domains: ['wholefoodsmarket.com', 'wholefoods.com'], defaultCategory: 'groceries', tags: ['organic', 'premium'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'kroger', displayName: 'Kroger', domains: ['kroger.com'], defaultCategory: 'groceries', tags: ['supermarket'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'safeway', displayName: 'Safeway', domains: ['safeway.com'], defaultCategory: 'groceries', tags: ['supermarket'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'traderjoes', displayName: "Trader Joe's", domains: ['traderjoes.com'], defaultCategory: 'groceries', tags: ['specialty'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'aldi', displayName: 'Aldi', domains: ['aldi.us', 'aldi.com'], defaultCategory: 'groceries', tags: ['discount'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'publix', displayName: 'Publix', domains: ['publix.com'], defaultCategory: 'groceries', tags: ['supermarket'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'wegmans', displayName: 'Wegmans', domains: ['wegmans.com'], defaultCategory: 'groceries', tags: ['supermarket', 'premium'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'heb', displayName: 'H-E-B', domains: ['heb.com'], defaultCategory: 'groceries', tags: ['supermarket'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'albertsons', displayName: 'Albertsons', domains: ['albertsons.com'], defaultCategory: 'groceries', tags: ['supermarket'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'stopandshop', displayName: 'Stop & Shop', domains: ['stopandshop.com'], defaultCategory: 'groceries', tags: ['supermarket'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'giantfood', displayName: 'Giant Food', domains: ['giantfood.com'], defaultCategory: 'groceries', tags: ['supermarket'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'foodlion', displayName: 'Food Lion', domains: ['foodlion.com'], defaultCategory: 'groceries', tags: ['supermarket', 'discount'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'sprouts', displayName: 'Sprouts', domains: ['sprouts.com'], defaultCategory: 'groceries', tags: ['organic', 'health'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'instacart', displayName: 'Instacart', domains: ['instacart.com'], defaultCategory: 'groceries', tags: ['delivery', 'marketplace'], verified: true, lastVerifiedAt: '2025-12-01' },
  
  // === DINING ===
  { id: 'doordash', displayName: 'DoorDash', domains: ['doordash.com'], defaultCategory: 'dining', tags: ['delivery', 'marketplace'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'ubereats', displayName: 'Uber Eats', domains: ['ubereats.com'], defaultCategory: 'dining', tags: ['delivery', 'marketplace'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'grubhub', displayName: 'Grubhub', domains: ['grubhub.com'], defaultCategory: 'dining', tags: ['delivery', 'marketplace'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'postmates', displayName: 'Postmates', domains: ['postmates.com'], defaultCategory: 'dining', tags: ['delivery'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'seamless', displayName: 'Seamless', domains: ['seamless.com'], defaultCategory: 'dining', tags: ['delivery'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'chipotle', displayName: 'Chipotle', domains: ['chipotle.com'], defaultCategory: 'dining', tags: ['fast-casual'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'starbucks', displayName: 'Starbucks', domains: ['starbucks.com'], defaultCategory: 'dining', tags: ['coffee'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'mcdonalds', displayName: "McDonald's", domains: ['mcdonalds.com'], defaultCategory: 'dining', tags: ['fast-food'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'wendys', displayName: "Wendy's", domains: ['wendys.com'], defaultCategory: 'dining', tags: ['fast-food'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'burgerking', displayName: 'Burger King', domains: ['bk.com', 'burgerking.com'], defaultCategory: 'dining', tags: ['fast-food'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'tacobell', displayName: 'Taco Bell', domains: ['tacobell.com'], defaultCategory: 'dining', tags: ['fast-food'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'chickfila', displayName: 'Chick-fil-A', domains: ['chick-fil-a.com'], defaultCategory: 'dining', tags: ['fast-food'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'dominos', displayName: "Domino's", domains: ['dominos.com'], defaultCategory: 'dining', tags: ['pizza', 'delivery'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'pizzahut', displayName: 'Pizza Hut', domains: ['pizzahut.com'], defaultCategory: 'dining', tags: ['pizza'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'papajohns', displayName: "Papa John's", domains: ['papajohns.com'], defaultCategory: 'dining', tags: ['pizza'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'subway', displayName: 'Subway', domains: ['subway.com', 'order.subway.com'], defaultCategory: 'dining', tags: ['fast-food'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'olivegarden', displayName: 'Olive Garden', domains: ['olivegarden.com'], defaultCategory: 'dining', tags: ['casual-dining'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'applebees', displayName: "Applebee's", domains: ['applebees.com'], defaultCategory: 'dining', tags: ['casual-dining'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'chilis', displayName: "Chili's", domains: ['chilis.com'], defaultCategory: 'dining', tags: ['casual-dining'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'tgifridays', displayName: "TGI Friday's", domains: ['tgifridays.com'], defaultCategory: 'dining', tags: ['casual-dining'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'outback', displayName: 'Outback Steakhouse', domains: ['outback.com'], defaultCategory: 'dining', tags: ['casual-dining'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'panerabread', displayName: 'Panera Bread', domains: ['panerabread.com'], defaultCategory: 'dining', tags: ['fast-casual'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'dunkin', displayName: "Dunkin'", domains: ['dunkindonuts.com', 'dunkin.com'], defaultCategory: 'dining', tags: ['coffee', 'fast-food'], verified: true, lastVerifiedAt: '2025-12-01' },

  // === ONLINE RETAIL ===
  { id: 'amazon', displayName: 'Amazon', domains: ['amazon.com', 'amzn.com', 'smile.amazon.com'], defaultCategory: 'online_retail', tags: ['marketplace', 'general'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'ebay', displayName: 'eBay', domains: ['ebay.com'], defaultCategory: 'online_retail', tags: ['marketplace', 'auction'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'etsy', displayName: 'Etsy', domains: ['etsy.com'], defaultCategory: 'online_retail', tags: ['marketplace', 'handmade'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'aliexpress', displayName: 'AliExpress', domains: ['aliexpress.com'], defaultCategory: 'online_retail', tags: ['marketplace', 'international'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'temu', displayName: 'Temu', domains: ['temu.com'], defaultCategory: 'online_retail', tags: ['discount', 'marketplace'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'shein', displayName: 'Shein', domains: ['shein.com', 'us.shein.com'], defaultCategory: 'apparel', tags: ['fast-fashion', 'discount'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'wish', displayName: 'Wish', domains: ['wish.com'], defaultCategory: 'online_retail', tags: ['discount', 'marketplace'], verified: true, lastVerifiedAt: '2025-12-01' },
  
  // === TRAVEL ===
  { id: 'expedia', displayName: 'Expedia', domains: ['expedia.com'], defaultCategory: 'travel', tags: ['ota', 'booking'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'booking', displayName: 'Booking.com', domains: ['booking.com'], defaultCategory: 'travel', tags: ['ota', 'hotels'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'airbnb', displayName: 'Airbnb', domains: ['airbnb.com'], defaultCategory: 'travel', tags: ['lodging', 'vacation'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'vrbo', displayName: 'Vrbo', domains: ['vrbo.com'], defaultCategory: 'travel', tags: ['lodging', 'vacation'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'kayak', displayName: 'Kayak', domains: ['kayak.com'], defaultCategory: 'travel', tags: ['metasearch'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'priceline', displayName: 'Priceline', domains: ['priceline.com'], defaultCategory: 'travel', tags: ['ota', 'discount'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'tripadvisor', displayName: 'TripAdvisor', domains: ['tripadvisor.com'], defaultCategory: 'travel', tags: ['reviews', 'booking'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'hotels', displayName: 'Hotels.com', domains: ['hotels.com'], defaultCategory: 'travel', tags: ['ota', 'hotels'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'marriott', displayName: 'Marriott', domains: ['marriott.com'], defaultCategory: 'travel', tags: ['hotel-chain'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'hilton', displayName: 'Hilton', domains: ['hilton.com'], defaultCategory: 'travel', tags: ['hotel-chain'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'hyatt', displayName: 'Hyatt', domains: ['hyatt.com'], defaultCategory: 'travel', tags: ['hotel-chain'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'ihg', displayName: 'IHG', domains: ['ihg.com'], defaultCategory: 'travel', tags: ['hotel-chain'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'wyndham', displayName: 'Wyndham', domains: ['wyndhamhotels.com'], defaultCategory: 'travel', tags: ['hotel-chain'], verified: true, lastVerifiedAt: '2025-12-01' },
  
  // === AIRLINES ===
  { id: 'delta', displayName: 'Delta Airlines', domains: ['delta.com'], defaultCategory: 'travel', tags: ['airline'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'united', displayName: 'United Airlines', domains: ['united.com'], defaultCategory: 'travel', tags: ['airline'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'american', displayName: 'American Airlines', domains: ['aa.com'], defaultCategory: 'travel', tags: ['airline'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'southwest', displayName: 'Southwest Airlines', domains: ['southwest.com'], defaultCategory: 'travel', tags: ['airline', 'budget'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'jetblue', displayName: 'JetBlue', domains: ['jetblue.com'], defaultCategory: 'travel', tags: ['airline'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'spirit', displayName: 'Spirit Airlines', domains: ['spirit.com'], defaultCategory: 'travel', tags: ['airline', 'ultra-budget'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'frontier', displayName: 'Frontier Airlines', domains: ['flyfrontier.com'], defaultCategory: 'travel', tags: ['airline', 'ultra-budget'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'alaska', displayName: 'Alaska Airlines', domains: ['alaskaair.com'], defaultCategory: 'travel', tags: ['airline'], verified: true, lastVerifiedAt: '2025-12-01' },
  
  // === TRANSIT ===
  { id: 'uber', displayName: 'Uber', domains: ['uber.com'], defaultCategory: 'transit', tags: ['rideshare'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'lyft', displayName: 'Lyft', domains: ['lyft.com'], defaultCategory: 'transit', tags: ['rideshare'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'hertz', displayName: 'Hertz', domains: ['hertz.com'], defaultCategory: 'travel', tags: ['car-rental'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'enterprise', displayName: 'Enterprise', domains: ['enterprise.com'], defaultCategory: 'travel', tags: ['car-rental'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'avis', displayName: 'Avis', domains: ['avis.com'], defaultCategory: 'travel', tags: ['car-rental'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'budget', displayName: 'Budget', domains: ['budget.com'], defaultCategory: 'travel', tags: ['car-rental'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'national', displayName: 'National', domains: ['nationalcar.com'], defaultCategory: 'travel', tags: ['car-rental'], verified: true, lastVerifiedAt: '2025-12-01' },

  // === GAS ===
  { id: 'shell', displayName: 'Shell', domains: ['shell.com', 'shell.us'], defaultCategory: 'gas', tags: ['gas-station'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'chevron', displayName: 'Chevron', domains: ['chevron.com'], defaultCategory: 'gas', tags: ['gas-station'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'exxon', displayName: 'Exxon', domains: ['exxon.com'], defaultCategory: 'gas', tags: ['gas-station'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'mobil', displayName: 'Mobil', domains: ['exxonmobil.com'], defaultCategory: 'gas', tags: ['gas-station'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'bp', displayName: 'BP', domains: ['bp.com'], defaultCategory: 'gas', tags: ['gas-station'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'speedway', displayName: 'Speedway', domains: ['speedway.com'], defaultCategory: 'gas', tags: ['gas-station', 'convenience'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'suncor', displayName: 'Sunoco', domains: ['sunoco.com'], defaultCategory: 'gas', tags: ['gas-station'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'wawa', displayName: 'Wawa', domains: ['wawa.com'], defaultCategory: 'gas', tags: ['gas-station', 'convenience'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'sheetz', displayName: 'Sheetz', domains: ['sheetz.com'], defaultCategory: 'gas', tags: ['gas-station', 'convenience'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'racetrac', displayName: 'RaceTrac', domains: ['racetrac.com'], defaultCategory: 'gas', tags: ['gas-station', 'convenience'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'quiktrip', displayName: 'QuikTrip', domains: ['quiktrip.com'], defaultCategory: 'gas', tags: ['gas-station', 'convenience'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'cumberlandfarms', displayName: 'Cumberland Farms', domains: ['cumberlandfarms.com'], defaultCategory: 'gas', tags: ['gas-station', 'convenience'], verified: true, lastVerifiedAt: '2025-12-01' },
  
  // === STREAMING ===
  { id: 'netflix', displayName: 'Netflix', domains: ['netflix.com'], defaultCategory: 'streaming', tags: ['video'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'spotify', displayName: 'Spotify', domains: ['spotify.com'], defaultCategory: 'streaming', tags: ['music'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'hulu', displayName: 'Hulu', domains: ['hulu.com'], defaultCategory: 'streaming', tags: ['video'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'disneyplus', displayName: 'Disney+', domains: ['disneyplus.com', 'disney.com'], defaultCategory: 'streaming', tags: ['video'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'max', displayName: 'Max', domains: ['max.com', 'hbomax.com'], defaultCategory: 'streaming', tags: ['video'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'peacock', displayName: 'Peacock', domains: ['peacocktv.com'], defaultCategory: 'streaming', tags: ['video'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'paramount', displayName: 'Paramount+', domains: ['paramountplus.com'], defaultCategory: 'streaming', tags: ['video'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'appletv', displayName: 'Apple TV+', domains: ['tv.apple.com'], defaultCategory: 'streaming', tags: ['video'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'youtube', displayName: 'YouTube', domains: ['youtube.com', 'youtu.be'], defaultCategory: 'streaming', tags: ['video', 'ugc'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'twitch', displayName: 'Twitch', domains: ['twitch.tv'], defaultCategory: 'streaming', tags: ['gaming', 'live'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'applemusic', displayName: 'Apple Music', domains: ['music.apple.com'], defaultCategory: 'streaming', tags: ['music'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'amazonmusic', displayName: 'Amazon Music', domains: ['music.amazon.com'], defaultCategory: 'streaming', tags: ['music'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'pandora', displayName: 'Pandora', domains: ['pandora.com'], defaultCategory: 'streaming', tags: ['music'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'tidal', displayName: 'Tidal', domains: ['tidal.com'], defaultCategory: 'streaming', tags: ['music'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'audible', displayName: 'Audible', domains: ['audible.com'], defaultCategory: 'streaming', tags: ['audiobooks'], verified: true, lastVerifiedAt: '2025-12-01' },
  
  // === DRUGSTORES ===
  { id: 'cvs', displayName: 'CVS', domains: ['cvs.com'], defaultCategory: 'drugstores', tags: ['pharmacy', 'convenience'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'walgreens', displayName: 'Walgreens', domains: ['walgreens.com'], defaultCategory: 'drugstores', tags: ['pharmacy', 'convenience'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'riteaid', displayName: 'Rite Aid', domains: ['riteaid.com'], defaultCategory: 'drugstores', tags: ['pharmacy'], verified: true, lastVerifiedAt: '2025-12-01' },
  
  // === APPAREL ===
  { id: 'nike', displayName: 'Nike', domains: ['nike.com'], defaultCategory: 'apparel', tags: ['sportswear', 'footwear'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'adidas', displayName: 'Adidas', domains: ['adidas.com'], defaultCategory: 'apparel', tags: ['sportswear', 'footwear'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'underarmour', displayName: 'Under Armour', domains: ['underarmour.com'], defaultCategory: 'apparel', tags: ['sportswear'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'lululemon', displayName: 'Lululemon', domains: ['lululemon.com'], defaultCategory: 'apparel', tags: ['athletic'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'nordstrom', displayName: 'Nordstrom', domains: ['nordstrom.com', 'nordstromrack.com'], defaultCategory: 'department_store', tags: ['premium'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'macys', displayName: "Macy's", domains: ['macys.com'], defaultCategory: 'department_store', tags: ['department-store'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'saks', displayName: 'Saks Fifth Avenue', domains: ['saksfifthavenue.com', 'saksoff5th.com'], defaultCategory: 'department_store', tags: ['luxury'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'bloomingdales', displayName: "Bloomingdale's", domains: ['bloomingdales.com'], defaultCategory: 'department_store', tags: ['premium'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'neimanmarcus', displayName: 'Neiman Marcus', domains: ['neimanmarcus.com'], defaultCategory: 'department_store', tags: ['luxury'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'jcpenney', displayName: 'JCPenney', domains: ['jcpenney.com'], defaultCategory: 'department_store', tags: ['department-store'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'kohls', displayName: "Kohl's", domains: ['kohls.com'], defaultCategory: 'department_store', tags: ['department-store'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'gap', displayName: 'Gap', domains: ['gap.com'], defaultCategory: 'apparel', tags: ['casual'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'oldnavy', displayName: 'Old Navy', domains: ['oldnavy.com'], defaultCategory: 'apparel', tags: ['casual', 'value'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'bananarepublic', displayName: 'Banana Republic', domains: ['bananarepublic.com'], defaultCategory: 'apparel', tags: ['casual', 'business'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'hm', displayName: 'H&M', domains: ['hm.com', 'www2.hm.com'], defaultCategory: 'apparel', tags: ['fast-fashion'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'zara', displayName: 'Zara', domains: ['zara.com'], defaultCategory: 'apparel', tags: ['fast-fashion'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'uniqlo', displayName: 'Uniqlo', domains: ['uniqlo.com'], defaultCategory: 'apparel', tags: ['basics'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'asos', displayName: 'ASOS', domains: ['asos.com'], defaultCategory: 'apparel', tags: ['online', 'fashion'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'footlocker', displayName: 'Foot Locker', domains: ['footlocker.com'], defaultCategory: 'apparel', tags: ['footwear'], verified: true, lastVerifiedAt: '2025-12-01' },
  
  // === ELECTRONICS ===
  { id: 'apple', displayName: 'Apple', domains: ['apple.com'], defaultCategory: 'electronics', tags: ['tech', 'premium'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'bestbuy', displayName: 'Best Buy', domains: ['bestbuy.com'], defaultCategory: 'electronics', tags: ['electronics', 'appliances'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'newegg', displayName: 'Newegg', domains: ['newegg.com'], defaultCategory: 'electronics', tags: ['electronics', 'computers'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'bhphoto', displayName: 'B&H Photo', domains: ['bhphotovideo.com'], defaultCategory: 'electronics', tags: ['electronics', 'cameras'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'microsoft', displayName: 'Microsoft', domains: ['microsoft.com', 'xbox.com'], defaultCategory: 'electronics', tags: ['tech', 'software'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'samsung', displayName: 'Samsung', domains: ['samsung.com'], defaultCategory: 'electronics', tags: ['tech', 'devices'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'dell', displayName: 'Dell', domains: ['dell.com'], defaultCategory: 'electronics', tags: ['computers'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'lenovo', displayName: 'Lenovo', domains: ['lenovo.com'], defaultCategory: 'electronics', tags: ['computers'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'hp', displayName: 'HP', domains: ['hp.com'], defaultCategory: 'electronics', tags: ['computers', 'printers'], verified: true, lastVerifiedAt: '2025-12-01' },
  
  // === HOME IMPROVEMENT ===
  { id: 'homedepot', displayName: 'Home Depot', domains: ['homedepot.com'], defaultCategory: 'home_improvement', tags: ['hardware', 'home'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'lowes', displayName: "Lowe's", domains: ['lowes.com'], defaultCategory: 'home_improvement', tags: ['hardware', 'home'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'ikea', displayName: 'IKEA', domains: ['ikea.com'], defaultCategory: 'home_improvement', tags: ['furniture'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'wayfair', displayName: 'Wayfair', domains: ['wayfair.com'], defaultCategory: 'home_improvement', tags: ['furniture', 'home'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'williams-sonoma', displayName: 'Williams-Sonoma', domains: ['williams-sonoma.com'], defaultCategory: 'home_improvement', tags: ['kitchen', 'premium'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'potterybarn', displayName: 'Pottery Barn', domains: ['potterybarn.com'], defaultCategory: 'home_improvement', tags: ['furniture', 'home'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'crateandbarrel', displayName: 'Crate & Barrel', domains: ['crateandbarrel.com'], defaultCategory: 'home_improvement', tags: ['furniture', 'home'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'bedbathandbeyond', displayName: 'Bed Bath & Beyond', domains: ['bedbathandbeyond.com'], defaultCategory: 'home_improvement', tags: ['home', 'bedding'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'containerstore', displayName: 'The Container Store', domains: ['containerstore.com'], defaultCategory: 'home_improvement', tags: ['organization'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'houzz', displayName: 'Houzz', domains: ['houzz.com'], defaultCategory: 'home_improvement', tags: ['home', 'marketplace'], verified: true, lastVerifiedAt: '2025-12-01' },

  // === BEAUTY ===
  { id: 'sephora', displayName: 'Sephora', domains: ['sephora.com'], defaultCategory: 'beauty', tags: ['cosmetics', 'premium'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'ulta', displayName: 'Ulta', domains: ['ulta.com'], defaultCategory: 'beauty', tags: ['cosmetics'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'bathandbodyworks', displayName: 'Bath & Body Works', domains: ['bathandbodyworks.com'], defaultCategory: 'beauty', tags: ['fragrance', 'body'], verified: true, lastVerifiedAt: '2025-12-01' },

  // === ENTERTAINMENT ===
  { id: 'ticketmaster', displayName: 'Ticketmaster', domains: ['ticketmaster.com'], defaultCategory: 'entertainment', tags: ['tickets', 'events'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'stubhub', displayName: 'StubHub', domains: ['stubhub.com'], defaultCategory: 'entertainment', tags: ['tickets', 'resale'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'seatgeek', displayName: 'SeatGeek', domains: ['seatgeek.com'], defaultCategory: 'entertainment', tags: ['tickets'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'fandango', displayName: 'Fandango', domains: ['fandango.com'], defaultCategory: 'entertainment', tags: ['movies', 'tickets'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'amctheatres', displayName: 'AMC Theatres', domains: ['amctheatres.com'], defaultCategory: 'entertainment', tags: ['movies'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'regalcinemas', displayName: 'Regal Cinemas', domains: ['regmovies.com'], defaultCategory: 'entertainment', tags: ['movies'], verified: true, lastVerifiedAt: '2025-12-01' },

  // === GAMING ===
  { id: 'steam', displayName: 'Steam', domains: ['store.steampowered.com', 'steampowered.com'], defaultCategory: 'entertainment', tags: ['gaming', 'digital'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'playstation', displayName: 'PlayStation Store', domains: ['store.playstation.com', 'playstation.com'], defaultCategory: 'entertainment', tags: ['gaming', 'digital'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'gamestop', displayName: 'GameStop', domains: ['gamestop.com'], defaultCategory: 'electronics', tags: ['gaming', 'retail'], verified: true, lastVerifiedAt: '2025-12-01' },

  // === TELECOM ===
  { id: 'verizon', displayName: 'Verizon', domains: ['verizon.com'], defaultCategory: 'telecom', tags: ['mobile', 'internet'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'att', displayName: 'AT&T', domains: ['att.com'], defaultCategory: 'telecom', tags: ['mobile', 'internet'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'tmobile', displayName: 'T-Mobile', domains: ['t-mobile.com'], defaultCategory: 'telecom', tags: ['mobile'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'xfinity', displayName: 'Xfinity', domains: ['xfinity.com'], defaultCategory: 'telecom', tags: ['internet', 'cable'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'spectrum', displayName: 'Spectrum', domains: ['spectrum.com'], defaultCategory: 'telecom', tags: ['internet', 'cable'], verified: true, lastVerifiedAt: '2025-12-01' },

  // === UTILITIES ===
  { id: 'pge', displayName: 'PG&E', domains: ['pge.com'], defaultCategory: 'utilities', tags: ['electric', 'gas'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'coned', displayName: 'Con Edison', domains: ['coned.com'], defaultCategory: 'utilities', tags: ['electric'], verified: true, lastVerifiedAt: '2025-12-01' },

  // === SPORTS & OUTDOORS ===
  { id: 'dickssportinggoods', displayName: "Dick's Sporting Goods", domains: ['dickssportinggoods.com'], defaultCategory: 'sports', tags: ['sports', 'outdoor'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'rei', displayName: 'REI', domains: ['rei.com'], defaultCategory: 'sports', tags: ['outdoor'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'cabelas', displayName: "Cabela's", domains: ['cabelas.com'], defaultCategory: 'sports', tags: ['outdoor', 'hunting'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'basspro', displayName: 'Bass Pro Shops', domains: ['basspro.com'], defaultCategory: 'sports', tags: ['outdoor', 'fishing'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'patagonia', displayName: 'Patagonia', domains: ['patagonia.com'], defaultCategory: 'apparel', tags: ['outdoor'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'thenorthface', displayName: 'The North Face', domains: ['thenorthface.com'], defaultCategory: 'apparel', tags: ['outdoor'], verified: true, lastVerifiedAt: '2025-12-01' },
  
  // === PET ===
  { id: 'petco', displayName: 'Petco', domains: ['petco.com'], defaultCategory: 'pet', tags: ['pet'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'petsmart', displayName: 'PetSmart', domains: ['petsmart.com'], defaultCategory: 'pet', tags: ['pet'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'chewy', displayName: 'Chewy', domains: ['chewy.com'], defaultCategory: 'pet', tags: ['pet', 'online'], verified: true, lastVerifiedAt: '2025-12-01' },

  // === OFFICE ===
  { id: 'staples', displayName: 'Staples', domains: ['staples.com'], defaultCategory: 'office', tags: ['office'], verified: true, lastVerifiedAt: '2025-12-01' },
  { id: 'officedepot', displayName: 'Office Depot', domains: ['officedepot.com'], defaultCategory: 'office', tags: ['office'], verified: true, lastVerifiedAt: '2025-12-01' },
];

/**
 * Find a merchant by domain
 */
export function findMerchantByDomain(domain: string): MerchantRecord | null {
  const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
  
  for (const merchant of MERCHANT_REGISTRY) {
    for (const d of merchant.domains) {
      if (normalizedDomain === d || normalizedDomain.endsWith('.' + d)) {
        return merchant;
      }
    }
  }
  
  return null;
}

/**
 * Search merchants by name
 */
export function searchMerchants(query: string): MerchantRecord[] {
  const lowerQuery = query.toLowerCase();
  return MERCHANT_REGISTRY.filter(m => 
    m.displayName.toLowerCase().includes(lowerQuery) ||
    m.id.includes(lowerQuery) ||
    m.domains.some(d => d.includes(lowerQuery))
  );
}
