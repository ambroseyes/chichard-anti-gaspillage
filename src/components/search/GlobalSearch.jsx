import React from 'react';
import AdvancedGlobalSearch from './AdvancedGlobalSearch';

export default function GlobalSearch({ isOpen, onClose, userRole }) {
  return <AdvancedGlobalSearch isOpen={isOpen} onClose={onClose} userRole={userRole} />;
}