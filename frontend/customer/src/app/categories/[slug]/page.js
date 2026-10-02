"use client";

import React, { use } from 'react';
import { redirect } from 'next/navigation';

export default function CategorySlugPage({ params }) {
  const { slug } = use(params);
  redirect(`/shop?category=${slug}`);
}
