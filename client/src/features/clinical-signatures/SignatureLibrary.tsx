import { Star, Award, Users, Clock, Search, Bookmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ClinicalSignature } from "./types";

interface SignatureLibraryProps {
  signatures: ClinicalSignature[];
  onSignatureSelected?: (signature: ClinicalSignature) => void;
  onAddToFavorites?: (signatureId: string) => void;
  favorites?: string[];
}

export function SignatureLibrary({
  signatures,
  onSignatureSelected,
  onAddToFavorites,
  favorites = [],
}: SignatureLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [...new Set(signatures.flatMap((s) => s.clinicalContext))];

  const filtered = signatures.filter((sig) => {
    const matchesSearch =
      !searchQuery ||
      sig.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sig.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      !selectedCategory || sig.clinicalContext.includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const topRated = [...filtered].sort((a, b) => b.communityRating - a.communityRating).slice(0, 5);
  const recentlyUsed = [...filtered].sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()).slice(0, 5);

  if (!signatures || signatures.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-600" />
            Biblioteca de Assinaturas Clínicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
            <Award className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma assinatura clínica disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-600" />
            <CardTitle>Assinaturas Clínicas — Baterias Pré-Validadas</CardTitle>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Baterias criadas e validadas por especialistas. Comece rapidamente com protocolos comprovados.
          </p>
        </CardHeader>
      </Card>

      {/* Search */}
      <Card className="bg-gray-50 border-gray-300">
        <CardContent className="pt-4 space-y-3">
          <div className="flex gap-2">
            <Search className="h-5 w-5 text-gray-400 mt-2.5" />
            <input
              type="text"
              placeholder="Buscar assinaturas clínicas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Filtrar por Contexto</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 rounded-full text-sm transition ${
                  selectedCategory === null
                    ? "bg-purple-500 text-white"
                    : "bg-white border border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    selectedCategory === cat
                      ? "bg-purple-500 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Rated */}
      {topRated.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Mais Bem Avaliadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topRated.map((sig) => (
                <SignatureCard
                  key={sig.id}
                  signature={sig}
                  isFavorited={favorites.includes(sig.id)}
                  onSelect={() => onSignatureSelected?.(sig)}
                  onAddToFavorites={() => onAddToFavorites?.(sig.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recently Created */}
      {recentlyUsed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🆕 Recém-Criadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentlyUsed.map((sig) => (
                <SignatureCard
                  key={sig.id}
                  signature={sig}
                  isFavorited={favorites.includes(sig.id)}
                  onSelect={() => onSignatureSelected?.(sig)}
                  onAddToFavorites={() => onAddToFavorites?.(sig.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Todos ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length > 0 ? (
            <div className="space-y-2">
              {filtered.map((sig) => (
                <SignatureCard
                  key={sig.id}
                  signature={sig}
                  isFavorited={favorites.includes(sig.id)}
                  onSelect={() => onSignatureSelected?.(sig)}
                  onAddToFavorites={() => onAddToFavorites?.(sig.id)}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
              <p className="text-sm">Nenhuma assinatura encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Sub-component for signature card
function SignatureCard({
  signature,
  isFavorited,
  onSelect,
  onAddToFavorites,
}: {
  signature: ClinicalSignature;
  isFavorited: boolean;
  onSelect: () => void;
  onAddToFavorites: () => void;
}) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-gray-900">{signature.name}</p>
            {signature.isVerified && (
              <Badge className="bg-green-100 text-green-900 text-xs">✓ Verificada</Badge>
            )}
          </div>

          <p className="text-xs text-gray-600 mt-1">{signature.description}</p>

          <div className="flex flex-wrap gap-1 mt-2">
            {signature.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {signature.estimatedDuration}m
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {signature.scaleIds.length} escalas
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500" />
              {signature.communityRating.toFixed(1)} ({signature.communityRatingCount})
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Button
            onClick={onAddToFavorites}
            variant="ghost"
            size="sm"
            className={isFavorited ? "text-purple-600" : "text-gray-600"}
          >
            <Bookmark className={`h-4 w-4 ${isFavorited ? "fill-purple-600" : ""}`} />
          </Button>
          <Button
            onClick={onSelect}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
            size="sm"
          >
            Usar
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
