
"use client";

import React, { useEffect, useRef } from 'react';
import type { Control, UseFormSetValue, FieldErrors, FieldPath, FieldValues } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMap } from '@vis.gl/react-google-maps';

interface GooglePlacesAutocompleteInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  placeholder?: string;
  errors: FieldErrors<TFieldValues>;
  setValue: UseFormSetValue<TFieldValues>;
  isApiReady: boolean;
}

export function GooglePlacesAutocompleteInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  label,
  placeholder,
  errors,
  setValue,
  isApiReady,
}: GooglePlacesAutocompleteInputProps<TFieldValues, TName>) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const map = useMap(); // Get map instance from context

  useEffect(() => {
    if (
      !isApiReady ||
      !inputRef.current ||
      typeof window.google === 'undefined' ||
      !window.google.maps?.places?.Autocomplete
    ) {
      return;
    }

    if (autocompleteRef.current && typeof window.google.maps.event !== 'undefined') {
      window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
    }

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        fields: ["formatted_address"],
        types: ["geocode"],
      });
      autocompleteRef.current = autocomplete;

      // Bind the suggestions to the map's viewport for better relevance
      if (map) {
        autocomplete.bindTo("bounds", map);
      }

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place && place.formatted_address) {
          setValue(name, place.formatted_address as any, { shouldValidate: true, shouldDirty: true });
        } else if (inputRef.current) {
          setValue(name, inputRef.current.value as any, { shouldValidate: true, shouldDirty: true });
        }
      });
    } catch (error) {
      console.error(`Error initializing Google Places Autocomplete for ${name}:`, error);
    }
    
    const currentInputRef = inputRef.current;
    const onKeyDownPreventSubmit = (event: KeyboardEvent) => {
      const pacContainer = document.querySelector('.pac-container');
      if (event.key === 'Enter' && pacContainer && getComputedStyle(pacContainer).display !== 'none') {
        event.preventDefault();
      }
    };

    if (currentInputRef) {
      currentInputRef.addEventListener('keydown', onKeyDownPreventSubmit);
    }

    return () => {
      if (currentInputRef) {
        currentInputRef.removeEventListener('keydown', onKeyDownPreventSubmit);
      }
      if (autocompleteRef.current && typeof window.google?.maps?.event !== 'undefined') {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      autocompleteRef.current = null;
    };
  }, [isApiReady, name, setValue, map]); // Added map to dependency array

  return (
    <div>
      <Label htmlFor={name} className="font-body">
        {label}
      </Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Input
            id={name}
            ref={(el) => {
              field.ref(el);
              inputRef.current = el;
            }}
            onChange={(e) => field.onChange(e.target.value)}
            onBlur={field.onBlur}
            value={field.value || ''}
            placeholder={!isApiReady ? "Google Maps API key missing..." : placeholder}
            className="font-body"
            autoComplete="off"
            disabled={!isApiReady}
          />
        )}
      />
      {errors[name] && (
        <p className="text-sm text-destructive font-body mt-1">
          {(errors[name] as any)?.message}
        </p>
      )}
    </div>
  );
}

    