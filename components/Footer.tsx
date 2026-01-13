
import React from 'react';

interface FooterProps {
  themeStyles: any;
}

const Footer: React.FC<FooterProps> = ({ themeStyles }) => (
  <footer className={`text-center pt-8 border-t ${themeStyles.border} pb-12`}>
    <p className={`${themeStyles.textSecondary} italic text-sm`}>“Kemenangan sejati adalah istiqamah.”</p>
  </footer>
);

export default Footer;
