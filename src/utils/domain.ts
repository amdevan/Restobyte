export const isSaaSDomain = (): boolean => {
    const hostname = window.location.hostname;
    // Check if subdomain is 'admin' or 'saas'
    // Also handle localhost for testing: admin.localhost
    return hostname.startsWith('admin.') || hostname.startsWith('saas.');
};

export const getSaaSBasePath = (): string => {
    return isSaaSDomain() ? '' : '/saas';
};
