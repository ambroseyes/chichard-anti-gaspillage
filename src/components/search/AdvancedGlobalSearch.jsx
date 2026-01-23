import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Search, X, Filter, Save, Clock, TrendingUp, 
  Package, ShoppingCart, Store, Users, Star
} from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const entityConfig = {
  Product: { 
    icon: Package, 
    color: 'text-emerald-600', 
    bgColor: 'bg-emerald-100',
    searchFields: ['name', 'description', 'category', 'store_name']
  },
  Order: { 
    icon: ShoppingCart, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-100',
    searchFields: ['customer_name', 'customer_email', 'status']
  },
  Store: { 
    icon: Store, 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-100',
    searchFields: ['name', 'city', 'email']
  },
  User: { 
    icon: Users, 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-100',
    searchFields: ['full_name', 'email']
  }
};

export default function AdvancedGlobalSearch({ isOpen, onClose, userRole = 'user' }) {
  const [query, setQuery] = useState('');
  const [selectedEntities, setSelectedEntities] = useState(['Product']);
  const [showFilters, setShowFilters] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
    enabled: isOpen
  });

  const { data: savedSearches = [] } = useQuery({
    queryKey: ['saved-searches', user?.email],
    queryFn: () => base44.entities.SavedSearch.filter({ user_email: user.email }, '-last_used'),
    enabled: !!user && isOpen
  });

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['global-search', query, selectedEntities],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const results = [];
      
      for (const entityType of selectedEntities) {
        try {
          const entityData = await base44.entities[entityType].list('-created_date', 20);
          const config = entityConfig[entityType];
          
          const filtered = entityData.filter(item => {
            return config.searchFields.some(field => 
              item[field]?.toLowerCase().includes(query.toLowerCase())
            );
          });
          
          results.push(...filtered.map(item => ({ ...item, _entityType: entityType })));
        } catch (e) {
          console.error(`Error searching ${entityType}:`, e);
        }
      }
      
      return results;
    },
    enabled: isOpen && query.length >= 2
  });

  const saveSearchMutation = useMutation({
    mutationFn: (data) => base44.entities.SavedSearch.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      toast.success('Recherche sauvegardée');
      setShowSaveDialog(false);
      setSearchName('');
    }
  });

  const useSavedSearchMutation = useMutation({
    mutationFn: (searchId) => base44.entities.SavedSearch.update(searchId, {
      usage_count: savedSearches.find(s => s.id === searchId).usage_count + 1,
      last_used: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    }
  });

  const handleSaveSearch = () => {
    saveSearchMutation.mutate({
      user_email: user.email,
      search_name: searchName,
      search_query: query,
      entity_types: selectedEntities,
      last_used: new Date().toISOString()
    });
  };

  const loadSavedSearch = (search) => {
    setQuery(search.search_query);
    setSelectedEntities(search.entity_types || ['Product']);
    useSavedSearchMutation.mutate(search.id);
  };

  const handleResultClick = (result) => {
    const entityType = result._entityType;
    
    switch (entityType) {
      case 'Product':
        navigate(createPageUrl('ProductDetail') + `?id=${result.id}`);
        break;
      case 'Order':
        navigate(createPageUrl('Orders'));
        break;
      case 'Store':
        navigate(createPageUrl('Catalog') + `?store=${result.id}`);
        break;
      default:
        break;
    }
    
    onClose();
  };

  const toggleEntity = (entity) => {
    setSelectedEntities(prev => 
      prev.includes(entity) 
        ? prev.filter(e => e !== entity)
        : [...prev, entity]
    );
  };

  const availableEntities = userRole === 'admin' 
    ? ['Product', 'Order', 'Store', 'User']
    : ['Product', 'Store'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden p-0">
        <div className="flex flex-col h-full">
          {/* Search Header */}
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher produits, commandes, partenaires..."
                  className="pl-10 pr-10 h-12 text-base"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-5 h-5" />
              </Button>
              {query && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowSaveDialog(true)}
                >
                  <Save className="w-5 h-5" />
                </Button>
              )}
            </div>

            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2"
                >
                  <p className="text-sm font-medium">Rechercher dans:</p>
                  <div className="flex flex-wrap gap-2">
                    {availableEntities.map((entity) => {
                      const config = entityConfig[entity];
                      const Icon = config.icon;
                      return (
                        <button
                          key={entity}
                          onClick={() => toggleEntity(entity)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                            selectedEntities.includes(entity)
                              ? `${config.bgColor} border-current ${config.color}`
                              : 'bg-white border-gray-200 text-gray-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm">{entity}s</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-4">
            {!query && savedSearches.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recherches récentes
                </h3>
                {savedSearches.slice(0, 5).map((search) => (
                  <button
                    key={search.id}
                    onClick={() => loadSavedSearch(search)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Search className="w-4 h-4 text-gray-400" />
                      <div className="text-left">
                        <p className="font-medium">{search.search_name}</p>
                        <p className="text-sm text-gray-500">{search.search_query}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{search.usage_count} fois</Badge>
                  </button>
                ))}
              </div>
            )}

            {query && query.length < 2 && (
              <p className="text-center text-gray-500 py-8">
                Tapez au moins 2 caractères pour rechercher
              </p>
            )}

            {query && isLoading && (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-gray-500 mt-3">Recherche en cours...</p>
              </div>
            )}

            {query && !isLoading && searchResults?.length === 0 && (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucun résultat trouvé</p>
              </div>
            )}

            {query && searchResults && searchResults.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  {searchResults.length} résultat(s) trouvé(s)
                </p>
                {searchResults.map((result) => {
                  const config = entityConfig[result._entityType];
                  const Icon = config.icon;
                  
                  return (
                    <motion.button
                      key={`${result._entityType}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-start gap-3 p-3 rounded-lg border hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className={`p-2 rounded-lg ${config.bgColor} ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {result.name || result.customer_name || result.full_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {result.description || result.city || result.email || result.status}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {result._entityType}
                        </Badge>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Save Search Dialog */}
        {showSaveDialog && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="font-semibold mb-4">Sauvegarder cette recherche</h3>
              <Input
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Nom de la recherche..."
                className="mb-4"
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowSaveDialog(false)} className="flex-1">
                  Annuler
                </Button>
                <Button 
                  onClick={handleSaveSearch}
                  disabled={!searchName}
                  className="flex-1"
                >
                  Sauvegarder
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}