// Cart event utilities for instant updates across components

export const dispatchCartUpdate = (action) => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('cartUpdate', { 
      detail: { action, timestamp: Date.now() } 
    });
    window.dispatchEvent(event);
  }
};

export const CART_ACTIONS = {
  ADD: 'add',
  REMOVE: 'remove',
  CLEAR: 'clear',
  REFRESH: 'refresh'
};