
import { Category, Recipe } from './types';

export const CATEGORIES: Category[] = [
  { id: 'popular', name: 'Popular', icon: 'local_fire_department', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbk-doS0UOi9ol1H92MPDw34fAlnS-hdsf_7YsaznKGAY_H28SW07KA2ww4VF8fUTJc5c7untKUcYh7E-CuIV3-3gw2mX7xjTAtBGLy9eHuYKwRSaf2X8LwBTWZXSW3QOjJfLX-hzX2_dUlFKHfJHslznoaj3CPWV78RwfAMDDwtuq5oiDoBfv8PHwUNy7fPS-H7m8D5m2ODVH-_GisMir_fWwTs8fjdO9RK15r3e414WCWW9HqwcBAscuXK1gXOBed-C8eyybmL4' },
  { id: 'breakfast', name: 'Breakfast', icon: 'sunny', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAqDlz5jDCYgg82CEZPf7VeJpR2-oLZcEu4KZ9Y88mcEp0sgLmGtOIdExx4jKl-_wC2aC94jqY6dcdOv_AqsRWRUKPKaLJwZEAizMmj_bO2AFKVFl_ooMJNS7pqED5IHw_KGvNxKacLhvch4mmD3a_RdDPJK-swPkoXlzdgpBpq0t66lZhFkf4VL7bv6OHsaWnAh_BkhnL6YDC71gYqw6-AiabVN7HnYhsuy_b3p-Nn-tJznccPmbZae25JMaSy9RY4QJ1VMX-PYyM' },
  { id: 'dinner', name: 'Dinner', icon: 'restaurant', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlgxLy_7RLl_BYTrlKDqy02Q1YgyM4B8gNdLbSGp0-DXUSYpTVASdYNEBLEv0hpJTRbx-l_GgoSXqzlWCSDz6EXt-Ga9o_3DAgyLdIOZsFCKxuuECKVGF2fRnBS5jpv9RJ-Gww1xuyWP1EvEbR08tm0saZ-jD-uufz29xMi6rx_1UUBei6dTMZtYE8XhYWUfVU4XxBz9ag7vPVObyXhpM9nJPOdGbvETHFnJiUaS4kRJTb8V3gRcW6EVJ1P0wRxTBZ3bk1cMxh0wY' },
  { id: 'seafood', name: 'Seafood', icon: 'set_meal', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4oN34_YnhIsahXMtOSQPm3m6fNZuegqGYzQM3SkncaE3T57YUthSQnJDAL5jscihtaeT93lpr_yR3_Rhp124y_BuKuS8iXRtwI8E5UjyDtbgCRWymVq--HgR8kJiCGwt3wCQsC2MaWliu6m5iKMuecBPA5GdiBFenwO_MaMh-3t0tFripd6x2XZbymQncIa_IV5uO2VVxkm6S3Whg5UsyAEmXFTRsGamU-uBSDl0VFKBso0ww2UMRt8LIkljtkUDuEOzahRCqhuU' },
  { id: 'vegan', name: 'Vegan', icon: 'eco', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLty2bdmnf-5rDQxnEGjatHhf8j2yU_66nYONRBZpUTs3uZHPs5JkB6Vhw4xhUPubB5EW-gTOQ_X71paR_2ToqEKekf0MeQoTF98pOKrZVd0aW1UHpla_hJBLYjMWLNCJjYrBbO-_0NF3vacnjIK92LdEmeOisksCltCXNM9O6KTO4xP7dYPkdMpaO_xZXn1Ur8qULdalg2E7gGiiGwmOqqWEDTqMPwi5XXAE74HHrNMU7B9bejJLJ7qZV7p2xoagjzLlgolBmjp4' },
];

export const RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Avocado & Egg Toast',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAqDlz5jDCYgg82CEZPf7VeJpR2-oLZcEu4KZ9Y88mcEp0sgLmGtOIdExx4jKl-_wC2aC94jqY6dcdOv_AqsRWRUKPKaLJwZEAizMmj_bO2AFKVFl_ooMJNS7pqED5IHw_KGvNxKacLhvch4mmD3a_RdDPJK-swPkoXlzdgpBpq0t66lZhFkf4VL7bv6OHsaWnAh_BkhnL6YDC71gYqw6-AiabVN7HnYhsuy_b3p-Nn-tJznccPmbZae25JMaSy9RY4QJ1VMX-PYyM',
    prepTime: '15m',
    rating: 4.8,
    reviews: 156,
    serves: '01',
    kcal: '320',
    level: 'Easy',
    category: 'breakfast',
    isFavorite: true,
    ingredients: ['1 Ripe avocado', '2 Slices sourdough', '1 Poached egg', 'Red pepper flakes'],
    directions: [{ step: 1, title: 'Toast bread', description: 'Toast the sourdough slices until golden.' }, { step: 2, title: 'Mash avocado', description: 'Mash avocado and spread it.' }]
  },
  {
    id: '2',
    title: 'Acai Smoothie Bowl',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLty2bdmnf-5rDQxnEGjatHhf8j2yU_66nYONRBZpUTs3uZHPs5JkB6Vhw4xhUPubB5EW-gTOQ_X71paR_2ToqEKekf0MeQoTF98pOKrZVd0aW1UHpla_hJBLYjMWLNCJjYrBbO-_0NF3vacnjIK92LdEmeOisksCltCXNM9O6KTO4xP7dYPkdMpaO_xZXn1Ur8qULdalg2E7gGiiGwmOqqWEDTqMPwi5XXAE74HHrNMU7B9bejJLJ7qZV7p2xoagjzLlgolBmjp4',
    prepTime: '10m',
    rating: 4.9,
    reviews: 120,
    serves: '01',
    kcal: '280',
    level: 'Easy',
    category: 'vegan',
    isFavorite: true,
    ingredients: ['Acai puree', 'Frozen berries', 'Granola', 'Chia seeds'],
    directions: [{ step: 1, title: 'Blend', description: 'Blend acai and berries.' }]
  },
  {
    id: '3',
    title: 'Classic Carbonara',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCd342eNl3ADhtzMjb1riRgwuJ7muCdd6904RB4-cTBSzOj72GvkMG5TmqMQFJcOreIr6gYqKmI9XFeB9yPRNoUhrsytgfxAMiG57h_hMPQrzpvC477GPU1KBMasWHQi4WSXJvA0is-FtPLhlg2BI-N5D98tmjq7FYA90zXTfuyBPX4n8lxbrPMfRow1pPI2uBHfhCj2cyyJ4uKUEXRqfqLSu6cB3bJsXRPadTH_kvUkDvc69OncAY-X81WiJQn5jMSNAnyUOBUIZ8',
    prepTime: '25m',
    rating: 4.5,
    reviews: 210,
    serves: '02',
    kcal: '650',
    level: 'Medium',
    category: 'dinner',
    isFavorite: true,
    ingredients: ['Spaghetti', 'Pancetta', 'Eggs', 'Pecorino Romano'],
    directions: [{ step: 1, title: 'Boil pasta', description: 'Cook pasta in salted water.' }]
  },
  {
    id: '4',
    title: 'Lemon Garlic Salmon',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4oN34_YnhIsahXMtOSQPm3m6fNZuegqGYzQM3SkncaE3T57YUthSQnJDAL5jscihtaeT93lpr_yR3_Rhp124y_BuKuS8iXRtwI8E5UjyDtbgCRWymVq--HgR8kJiCGwt3wCQsC2MaWliu6m5iKMuecBPA5GdiBFenwO_MaMh-3t0tFripd6x2XZbymQncIa_IV5uO2VVxkm6S3Whg5UsyAEmXFTRsGamU-uBSDl0VFKBso0ww2UMRt8LIkljtkUDuEOzahRCqhuU',
    prepTime: '20m',
    rating: 4.7,
    reviews: 89,
    serves: '01',
    kcal: '410',
    level: 'Medium',
    category: 'seafood',
    isFavorite: true,
    ingredients: ['Salmon fillet', 'Garlic', 'Lemon', 'Asparagus'],
    directions: [{ step: 1, title: 'Sear salmon', description: 'Sear salmon skin-side down.' }]
  }
];
