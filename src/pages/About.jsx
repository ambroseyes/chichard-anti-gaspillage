import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Leaf, ShoppingBag, Store, Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
        <div className="max-w-3xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Leaf className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">À propos de Chichard</h1>
          <p className="text-emerald-50 text-lg">La plateforme anti-gaspillage qui connecte commerces et consommateurs engagés</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Notre mission</h2>
          <p className="text-gray-600 leading-relaxed">
            Chichard est une plateforme anti-gaspillage innovante qui connecte les supermarchés et commerces locaux avec les consommateurs engagés pour réduire le gaspillage alimentaire au Cameroun et en Afrique. Chaque jour, des tonnes de produits encore consommables sont jetés simplement parce qu'ils approchent leur date de péremption ou qu'ils ne correspondent plus aux standards de vente. Chichard permet aux commerçants de proposer ces invendus à des prix réduits, sous forme de paniers surprise ou de produits spécifiques, récupérés en magasin via le système Click &amp; Collect ou livrés à domicile.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Pour qui ?</h2>
          <p className="text-gray-600 leading-relaxed">
            La plateforme s'adresse à tous les consommateurs soucieux de leur budget et de l'environnement, aux familles souhaitant faire des économies tout en consommant de manière responsable, ainsi qu'aux commerçants et supermarchés désireux de valoriser leurs invendus plutôt que de les jeter. Les partenaires peuvent gérer leurs stocks, créer des promotions automatiques basées sur les dates de péremption, suivre leurs réservations et mesurer leur impact écologique grâce à un tableau de bord dédié. Les consommateurs bénéficient de produits de qualité à prix réduits, de recommandations personnalisées et d'un programme de fidélité récompensant leurs gestes anti-gaspillage.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Qui sommes-nous ?</h2>
          <p className="text-gray-600 leading-relaxed">
            Chichard est développé par une équipe passionnée par la lutte contre le gaspillage alimentaire et la promotion d'une consommation plus durable. Notre objectif est de créer un écosystème où chaque acteur, du petit commerçant au grand supermarché en passant par le consommateur individuel, peut contribuer à réduire l'empreinte environnementale tout en réalisant des économies substantielles. Nous croyons que la technologie peut être un levier puissant pour transformer nos habitudes de consommation et bâtir un avenir plus durable.
          </p>
        </section>

        {/* Values cards */}
        <div className="grid md:grid-cols-3 gap-4 pt-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Anti-gaspillage</h3>
            <p className="text-sm text-gray-500">Sauvez les invendus et réduisez le gaspillage alimentaire</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mb-3">
              <Store className="w-5 h-5 text-teal-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Commerces locaux</h3>
            <p className="text-sm text-gray-500">Soutenez les supermarchés et commerces de votre quartier</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
              <Heart className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Économies</h3>
            <p className="text-sm text-gray-500">Profitez de produits de qualité à prix réduits</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-6">
          <Link to={createPageUrl('Contact')}>
            <Button className="bg-emerald-500 hover:bg-emerald-600">
              Nous contacter
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}