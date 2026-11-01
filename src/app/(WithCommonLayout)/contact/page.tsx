import ContactSection from '@/components/ContactPage/Contact';
import React from 'react';
import type { Metadata } from 'next'
 
export const metadata: Metadata={
  title: "TutorLink | Contact",
  description : "TutorLink helps you to find Best tutors"
}

const ContactPage = () => {
    return (
        <div className=''>
            <ContactSection />
            {/* Add any additional sections or components here */}
            {/* Example: <Partnerships /> */}
        </div>
    );
};

export default ContactPage;