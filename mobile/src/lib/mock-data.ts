import type { IconName } from '@/components/ui/icon';

// shortcut: dữ liệu mock lấy từ thiết kế Stitch, thay bằng API khi backend có endpoint khách sạn/booking.
const IMG = 'https://lh3.googleusercontent.com/aida-public/';

export const images = {
  homeHero: IMG + 'AB6AXuD6t829ptnvGgFD4gKG8zuphsMJ0TBZ2hH-ki2o4hgmWnL7VaCzFGn5BbAa082PmzFBeL9prseaqXLOUkaYLcEbL_mcQY631Joeoax1wyAxlywLZ70ZNPNPAE8jGgUjH3bTck3YULb9YPXluSWwpRHhYzTNuEf4moIbPmjEf1kmGX2c4Ra5f0pjUM7I9cmoj34zDu0zuyvSr_4H9SF0Bt2hc4-fNqWMKrLTGMZIusaDU0XA7zI8y33_',
  daNang: IMG + 'AB6AXuB79tWY8i2IQyA3CIzEcircX-pZvpY2jLklqRWPqjm5RleQWkEXmQCOb0OUzBU2dpNIec0FsqASk2Qw0Ab6Rz8hY2VqpnQmjrszv7Oli_jV_8KimwByyr159KzlNysPycwTyXemX1YSHAxGx3ay1Bt4UcdEBaQLmgcZxL5Ai3W_spPsuOmHE3bfIo78nMzeHs5ckS6l9XI24gx1WisGCE_SoEvucr4W_mRfcfxTzWJvrTW_3BY2Ouo7',
  hoiAn: IMG + 'AB6AXuBv1vTmLd4kAuhOulxJmMel4mk5mdVkVJxKGL0d5mzUZdqfLjPozHQD0133Yq6Nbeo60eYz_ykw_AzHX7AudurY3djDkUrtGTuHZQuTvqI1XQSKDpa2ax0lSzQITUqUVC_ZRmLIJGxLpN6jf4y2Ww8BbiAj1k0lNGy32tMHg12lM2wwA1faxRGGAxFRk85dguGFsvmSXCoTBxVcsy1jqQjaJmXexU8Ed6ZpEAlEeZ9ww9SpfkhZT7JF',
  daLat: IMG + 'AB6AXuBM52RXaeg5wOpvg0SabS9qF4eYA-0u4Yyq4ZwmYd1XMshmJu8GMYN590oMMlT2f0uI0Yszj8UgQWNN-GaPYKPPHOjlkx095KhqHRn9W5coye3hZHXrANLUzCdu1Ol4KGuO3w_kgaSLhrT-7OR4ZgsE1f_Rk6u99RHvcEMN41yTRtTQspo5mvUWAalh2lbd2J1s_OY-uRN1vLHrJJRKaT0T7n3O_Pp_4w2pw1UA4xgRjbnQZ9BNS8WV',
  phuQuoc: IMG + 'AB6AXuAjsko-_OFf6dppcuCh5dtPOGX_nzuT6D0F8HJOgQkZuSUTpd81QEn-JlecoditCbw-Nvt1WGJQTVvQDz7ljS18tAAGEp21KN8Bv6gTmawqbRvRGKCneT8Zv7uMVymoIyyQFwNfEWgCxieg5ft_SvG--m1blbEYkcujY3hv7EJ2V5xiFu7_ccQL422bwIMSHhtO3LVqJzfIDxjyLEC9wetzVmdEpR0V7SF5RZ0y3AK-WfS2wa69N349',
  anNhien: IMG + 'AB6AXuD2pwZq00A3ZYVJchBW8CKM-Z_zCGBBDtkw9DxdPy_YRtkC7ZMDtF7s9lNC8CaAE06rw3PG8am5xHJDHCThM0KBQwkWhCEGMEm-UpobkCJI39U1SzHaSjz_rRJJ-bQnsLI00jHeQ8fSOlZY-el0TrhnZiz446g5hsE9X5JWa47RCAIlnMswyHq3j2og-TA9GKKsvpzuut-JuVB-rHp9z-c3blg2N3tEe5VtRKBDx5wRTKxt9RRthBIy',
  phoHoai: IMG + 'AB6AXuA_fhWo-Cc_UBc0iwHpMELUB63Bbn-pS7pE_uUOoEYrZImZnnjgvcZ5KnIy7jgQv4aXCWJiWpVceumJxefl_WR1L4N2RoC6hE09d_wpE8esKTHxWvkmlWga1JQk2uR9XRbhoa09kz2Zu3_gVLBOQuOYTjmWKZVfrw6egL6VVYjcIXRvwKn1EKrJaV2k1DxZ30JbRjIvjrbvmtBqsQ6Tex2-S7GrnKPPavAF-OzfxyWryP-mHOscJFT6',
  mocNhien: IMG + 'AB6AXuCE-Fna05wCFmUjOVfWGvuFi9MkeOa-vSThcoD9PK5N5nPk4LjKVoNcJZSOwPPvpA_K4Wt1fnDBM4JGAU4o9kRsAtGnO315_MMCOW4wUTGeiHIAC3rlt8h-MN90UWu8N6xPUqMOT5k9wiXK7yxX-HiazoYtB8kZse477mwPBV1_D99z8H-JNmpEkGgZanvGTv_MqT4dJjjyluPg2Dm1pZJ2dK7IvWnzzbgHySxW-1AoXXFB1DwrDYhR',
  anNhienRoom: IMG + 'AB6AXuCN5EiCd0PnvucNffHztNyodglq_fwL39cMpQY70KGsEUtpZxOw7WoxP4qVHoEnDwaQDZKz9OSj3H6i5OSGMF8KWqbbwqiEZDZUlGPLy1uZanx59ezjg3_bRXgKhQKZfXaShqdkIDRoQzKk1GAA_xVbksfmHfFzbG1iLotzQVWOwBUoFys8t5JQqUsBNBAGGzc2sIZJkS9jPeYVUidQSQls37nM0c73U0g3TabsMwYMFi9wxeESLmyt',
  seaside: IMG + 'AB6AXuB5jQOzIIBav2V-bwP11HBMKQpH6igJfGyNxZB8QIa4d7ANAhRLReGnlht1PsIX4iecSvWIbjXXc-k8YV2GuSEvYIiFXrJR66CbWJ8_B0ItxDwaEXJwtz5W3Yiudz0Vu9kz5AA957STtJKHyQo4_IbgN3mPSCWWwo9I_GhTwbArn11q4FsAN9ZOfr1xUb-zi8regAi58rWjN2uKa6bJy5H9wXQkfv6mNR99nGUasXCdZiZURE2L71c4',
  senVilla: IMG + 'AB6AXuAYkCnc4H6JeMszkokuzbYWyDrfjxaAVq0pn7WRYe5N4rI5ekuHX_1zEf_2QRVSQv3Ehgopbn-LyaKa2k-yDLCk8aXAUkXZ8ddSpCQmB7kufxnen92G3mRIGVQeW4boClVlRvt_OTb_rEdEYJbA0QY0mwyY-JtekCX5bJ8wG_XSQ2gwxL6zDs47hx1kSN-hK_Geh9yxYIZ_Op4v6-BwdPIFDNG7WeTo9m06ykAyJDqAbakUOFr9SyBx',
  detail1: IMG + 'AB6AXuDKaDAE-KSrSZgqmLG8Ud6ftdrDGth8MWTz8FSF7OwmQdmEC2HLwDjjZ5iuIWAvcLee2Ag1dtrBhA18hNZixx3trgCojpHFdKr7uqdWhThHyISpguPIvlM2G1CAtcetGGIAOrG7UC0HVb-H2PEsATpeOXdw9OTgKsSWfEJNHOqvA7Tl9-ddVXPUBQIDINKHpG1Dy-oe-5rG-OFgu1xFxJEqy2oPiUiu9-lxHKJvGSZ63OGgt0snqXp2',
  detail2: IMG + 'AB6AXuDei2CkV3t07FbxvzYhsM1BbUo678o5s7jdnF8M1ap8xChdefXa7dy7PUGYcS8FUPTPd65-jiAvlkq2qUO_AjsjXRsehZcnJwrGbK-zvsmy97usCPp8PHroqRDn_jQNo5aVpFRL0YhLU4flx1F4cFAbPybij1X5vo-AOG2vJlQX8IGtpuCfL2HQWlWt_fZ3-5v1jpbXkH7Mn5wzoO5VIM-J20ExmuEdteJeL5sSL8xAYitmML4wRHVZ',
  detail3: IMG + 'AB6AXuDvwu-xvYLbOCbqu7FxxWVxat96A350aj6EmOe0ACG_vVT1o0b719PYDkymimad5_WtAM6c0SYFY8nPUWPnGpAURECTf3z49PxiPkB1GK9zkUEKmK_M4NVZMQc4_YRFf_hMSC9XH-bGUkygIimKiuiJ0k_FtudpOKCOpCLmix9u-ZWqQxiA-KKpMMON5mWkvI4GSZ60A7rECn-8HENBAKtnEPS_4WY50TzU79Zp6DQVfjmUkeWIcxsG',
  roomDeluxe: IMG + 'AB6AXuAPaw9dx9V3CreBZCJpc0kabmj590MpUtVW_rov4aAeMSXDvvuSSQftIWx250nMwoTgvmbImElYxsvVzrmd6dsZ2mr9R3ocig--nywmHc5EOijV9Hbkid4jQH7rdnWqhr8vOOGv7Ebmjzw6J6uZtUMjtJ4AsHutj9UFuMvZdoJTIQ_7kFKBt9cTKiJSOYJdAGuo-BlLlqpyHkHAfFbLOID06urxk9MdAH7awlDY3Qa7qwWrMtKAezcW',
  roomSuperior: IMG + 'AB6AXuBssmM1cyIDpycb2mmYihcZcQsmzRfEvfWkSoPDj-Xh9H2VxbYhue7a7MniCQKYCpq96ho-sT6rMD42Icp-vSwuGh0-wstRtKNqQMMS3ZwZjQuBKwnaGpiypzHbQhjJEToCoS4XhJsyc0AhxJ7qBpKuvk_Ue_FBi_uHqcdPd1B3hk25-opw3egUB3zWkYs5XK0ecdNoyVD95FKg3kvIvzYqWNLecgtbjoeubKesVWT74xSymS05f9b5',
  bookingThumb: IMG + 'AB6AXuBoW5cAqeYnzrZlbrPZk3T8j0kuaiJEIjt_3gIOo29-ifm1ABfU5aGpaXBRAEM3zmrm5esFrDQytL1CAr1wTxH7bFl3uGKBTvIGkeweVabXgcKSBEUEJCsJcoXSZ3gJLAoUpw5pgkq6FJH193oxS1qiRVzd40pF_jai49OyxXfJnd5wJLTyjm4AWB6jittStbF9RewNMA-8AtsdAEOzbC7DHlRHhpo0eJ21angKRNBO0gFptgUbDzYo',
  paymentThumb: IMG + 'AB6AXuCQGbc9lf8V0N0qPj8bDOg9BZX3CBtRufios8DKlum6dTX3-CH2ZeBRw50ud9NrY-V15vC6hr2b8ZLkeijtCiVsUh8_k18bbfu2fZxwL7HTw3IFldwPVcnef_bQI7uMwjKH8UVckzSrhq1YdQ7RWl3rkbPgSxrI4-lGoN4obtXR-q9EHkooAg-dpHja2mTPqYiViF4l1xFVl_lvy_wPuKuoXthT10WzfHLNvWP9FcECret_gT71aBX4',
  voucherHero: IMG + 'AB6AXuDxjN7lSnzKYOMZP8HaiI5OMcq0fKdAHDNftH7OAuQM7JXWoZYbd3oV66uq0Ix7QW96Yqid1S5CSRjfpvRIyM-8mbHh8ny2t4Vl3GSXddlKlCQCtJNu2sCPih3x5TVbHT9oyO4JHudtCnXkT5JJ3UsmAUX2vQofczCq8GlOapzxyeVLRNS-es_1gUFWmRh8Y0OCXpWOWfYnb_DyPJn44gS2rAA0zkcmOTlA6Gg3uValC3t4wMdBhyE7',
  hotelMap: IMG + 'AB6AXuBoZ2Gru_LpGkGJtXPEZXDwy6KM0kWW5Gt0Yet-Sai3aqV75yFXUwpJC3tKhCB8BpdUyVFAWun6_746rzuPM3KPcUpHqJAGLJCzKVUaVKxZIDLj6rSDJ96a6HUlfuxzW4RSdPDq5KQblNXYCp8FU3L5jYaE5qbCclAdspAs02AKebSBPM1UqA_ooXakOAc6DW8tNT9YFXv9eGt_GEo3NWcEuBMgJcffCyDR7ir0RoIOSKxKM3_a3dfH',
  tripThumb: IMG + 'AB6AXuDRQdVxeIDccp8k-_tpnY-JjmLcomWUDfCZkc2DxRulx1CCo1VzSZZXUDsA6hSz3ky9b3PEtrQmcWLi1gd9a_CrkUwgjZqcHu1d6iZPVz1PfFs7pZjsyb_t4iDkCXoORvO6kl7W-5aoCcU4DFRjSTKWWNEz5hgHgSIvwO4cDSnse7S4Ps425NoJI6SNHzOYJVkZrv7M9CBpHPPpciZbkVgPZi6uFzu1yQBjmecRScKNWF61px_a5Wcr',
  aiCard: IMG + 'AB6AXuCqKI86AECt1MoI2M46GOfoh6z2V-G4YR2Yqo9S-za34FkJ5gAKCTKcPpSN2qw2kVpDHPyRt50pWmdnK28TSTQzAohB3rAQrB2wTn4GCS9JDpMQiBTBUAByZ9erjLf52YEILZS55ma0CQqG8-Tz2tV59IZk58lyUI2CjD4vrsCyI2s-y5ouehl3sLrb1GrejZCrVdURzNwlm-c2e41aMefQunhxP42a-rS4aA7dRJhFasH80fcg0Bfm',
  avatar: IMG + 'AB6AXuCd6vJViOTeG8uU9gI4v5256BYNh-Bmd_62tmazARuNY0LEw0fWcPn-7nsUu0NZLRu6C67xzuBtsIVd_IXi0bRZ6y9vomxluFQH0IWCj9f6bbvJ1ykMDhQAUqF6KM20ENA8g0MwggXmXH0WPOwT_hBuI-yE3oTfxeay0qTiM0Ub5tbFKVSGNmfuFxEkt87kerVcduhVJIteZT8vQsLHy4ZDfmhyap2LaFYqIp0j-q8lQ8rvIGqsmfjf',
};

export type Hotel = {
  id: string;
  name: string;
  image: string;
  tag: string;
  tagIcon: IconName;
  location: string;
  rating: number;
  reviews: number;
  price: number;
  chips: { label: string; icon?: IconName }[];
  // dùng ở màn kết quả tìm kiếm
  category: string;
  searchImage: string;
  searchLocation: string;
  highlight: string;
  highlightIcon: IconName;
  roomType: string;
  perk: string;
  perkIcon: IconName;
};

export const hotels: Hotel[] = [
  {
    id: 'an-nhien-riverside',
    name: 'An Nhiên Riverside Hotel',
    category: 'Boutique 4 sao',
    image: images.anNhien,
    tag: 'Hội An Riverside',
    tagIcon: 'verified',
    location: 'Cẩm Nam, Hội An · Cách phố cổ 800m',
    rating: 4.8,
    reviews: 128,
    price: 1250000,
    chips: [{ label: 'Gần bờ sông' }, { label: 'Miễn phí hủy phòng' }],
    searchImage: images.anNhienRoom,
    searchLocation: 'Sơn Trà, Đà Nẵng',
    highlight: 'Cách Cầu Rồng 650m',
    highlightIcon: 'near_me',
    roomType: 'Deluxe River View',
    perk: 'Miễn phí bữa sáng bản địa',
    perkIcon: 'check_circle',
  },
  {
    id: 'pho-hoai-heritage',
    name: 'Phố Hoài Heritage Villa',
    category: 'Khách sạn 4 sao',
    image: images.phoHoai,
    tag: 'Biệt thự di sản',
    tagIcon: 'hotel_class',
    location: 'Minh An, Hội An · Trung tâm phố cổ',
    rating: 4.9,
    reviews: 96,
    price: 1890000,
    chips: [{ label: 'Bữa sáng sân vườn' }, { label: 'Miễn phí hủy phòng' }],
    searchImage: images.seaside,
    searchLocation: 'Bãi biển Mỹ Khê · Cách biển 80m',
    highlight: 'Hồ bơi vô cực hướng biển',
    highlightIcon: 'pool',
    roomType: 'Ocean Premier',
    perk: 'Miễn phí buffet sáng',
    perkIcon: 'coffee',
  },
  {
    id: 'moc-nhien-eco',
    name: 'Mộc Nhiên Eco-Lodge',
    category: 'Villa Di Sản',
    image: images.mocNhien,
    tag: 'Eco Retreat',
    tagIcon: 'forest',
    location: 'Tuyền Lâm, Đà Lạt · Rừng thông nguyên sinh',
    rating: 4.7,
    reviews: 114,
    price: 1420000,
    chips: [{ label: 'Bếp trà hữu cơ' }, { label: 'Miễn phí hủy phòng' }],
    searchImage: images.senVilla,
    searchLocation: 'Hải Châu, Đà Nẵng · Trung tâm thành phố',
    highlight: 'Khu vườn tĩnh lặng',
    highlightIcon: 'park',
    roomType: 'Heritage Garden Suite',
    perk: 'Trà chiều chào đón miễn phí',
    perkIcon: 'check_circle',
  },
];

export const destinations = [
  { name: 'Đà Nẵng', count: 84, image: images.daNang },
  { name: 'Hội An', count: 62, image: images.hoiAn },
  { name: 'Đà Lạt', count: 95, image: images.daLat },
  { name: 'Phú Quốc', count: 53, image: images.phuQuoc },
];

export const formatVnd = (value: number) => `${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ₫`;
