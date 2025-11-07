'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'

import { PrimaryButton } from '../../components/ui/PrimaryButton'
import { IconButton } from '../../components/ui/IconButton'
import { Tooltip } from '../../components/ui/Tooltip'
import { isModuleRelevant, type WizardProfile } from '../../src/modules/wizard/profile'
import { wizardSteps, type WizardScope } from './steps'
import { useWizardContext } from './useWizard'

const scopeOrder: WizardScope[] = ['Scope 1', 'Scope 2', 'Scope 3', 'Environment', 'Social', 'Governance']
const PROFILE_FILTER_THRESHOLD = 6

function parseTimestamp(timestamp: number | undefined): Date | null {
  if (typeof timestamp !== 'number') {
    return null
  }
  const parsed = new Date(timestamp)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatTimestamp(date: Date | null): string {
  if (!date) {
    return 'Ukendt tidspunkt'
  }

  try {
    return new Intl.DateTimeFormat('da-DK', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  } catch (error) {
    console.warn('Kunne ikke formatere tidspunkt', error)
    return date.toLocaleString()
  }
}

type ProfileSwitcherProps = {
  heading?: string | null
  description?: string | null
  showCreateButton?: boolean
  className?: string
}

export function ProfileSwitcher({
  heading = 'Gemte profiler',
  description = 'Administrer virksomhedsprofiler og skift mellem forskellige scopes.',
  showCreateButton = true,
  className,
}: ProfileSwitcherProps): JSX.Element {
  const { activeProfileId, profiles, createProfile, switchProfile, renameProfile, duplicateProfile, deleteProfile } =
    useWizardContext((context) => ({
      activeProfileId: context.activeProfileId,
      profiles: context.profiles,
      createProfile: context.createProfile,
      switchProfile: context.switchProfile,
      renameProfile: context.renameProfile,
      duplicateProfile: context.duplicateProfile,
      deleteProfile: context.deleteProfile,
    }))

  const sortedProfiles = useMemo(
    () =>
      Object.values(profiles).sort((a, b) => {
        if (a.id === activeProfileId) {
          return -1
        }
        if (b.id === activeProfileId) {
          return 1
        }
        const updatedA = parseTimestamp(a.updatedAt)?.getTime() ?? 0
        const updatedB = parseTimestamp(b.updatedAt)?.getTime() ?? 0
        if (updatedA === updatedB) {
          return a.name.localeCompare(b.name)
        }
        return updatedB - updatedA
      }),
    [activeProfileId, profiles]
  )

  const [query, setQuery] = useState('')

  const handleCreate = useCallback(() => {
    createProfile()
  }, [createProfile])

  const handleRename = useCallback(
    (profileId: string) => {
      const current = profiles[profileId]
      if (!current) {
        return
      }
      const nextName = window.prompt('Nyt profilnavn', current.name)
      if (nextName) {
        renameProfile(profileId, nextName)
      }
    },
    [profiles, renameProfile],
  )

  const handleDuplicate = useCallback(
    (profileId: string) => {
      duplicateProfile(profileId)
    },
    [duplicateProfile],
  )

  const handleDelete = useCallback(
    (profileId: string) => {
      const target = profiles[profileId]
      if (!target) {
        return
      }
      const confirmation = window.confirm(`Slet "${target.name}"? Handling kan ikke fortrydes.`)
      if (confirmation) {
        deleteProfile(profileId)
      }
    },
    [deleteProfile, profiles],
  )

  const computeScopeCoverage = useCallback(
    (profileId: string) => {
      const entry = profiles[profileId]
      if (!entry) {
        return scopeOrder.map((scope) => ({ scope, isActive: false }))
      }
      const coverage = new Set<WizardScope>()
      const profile = entry.profile as WizardProfile
      for (const step of wizardSteps) {
        if (isModuleRelevant(profile, step.id)) {
          coverage.add(step.scope)
        }
      }
      return scopeOrder.map((scope) => ({ scope, isActive: coverage.has(scope) }))
    },
    [profiles],
  )

  const profileDetails = useMemo(() => {
    return sortedProfiles.map((profile) => {
      const scopes = computeScopeCoverage(profile.id)
      const lastUpdatedDate = parseTimestamp(profile.updatedAt)
      const lastUpdated = formatTimestamp(lastUpdatedDate)
      const isoUpdatedAt = lastUpdatedDate?.toISOString()
      const haystack = [profile.name, ...scopes.filter((scope) => scope.isActive).map((scope) => scope.scope)]
        .join(' ')
        .toLowerCase()

      return {
        profile,
        scopes,
        lastUpdated,
        isoUpdatedAt,
        isActive: profile.id === activeProfileId,
        haystack,
      }
    })
  }, [activeProfileId, computeScopeCoverage, sortedProfiles])

  const shouldFilter = profileDetails.length > PROFILE_FILTER_THRESHOLD
  const normalisedQuery = query.trim().toLowerCase()

  const filteredProfiles = useMemo(() => {
    if (!shouldFilter || normalisedQuery.length === 0) {
      return profileDetails
    }
    return profileDetails.filter((entry) => entry.haystack.includes(normalisedQuery))
  }, [normalisedQuery, profileDetails, shouldFilter])

  const totalProfileCount = Object.keys(profiles).length

  const handleQueryChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
  }, [])

  return (
    <section
      className={['ds-profile-switcher', 'ds-card', 'ds-stack', className].filter(Boolean).join(' ')}
      data-testid="profile-switcher"
    >
      {(heading || description || showCreateButton) && (
        <header className="ds-profile-switcher__header">
          <div className="ds-stack-sm">
            {heading && <h2 className="ds-heading-sm">{heading}</h2>}
            {description && <p className="ds-text-subtle">{description}</p>}
          </div>
          {showCreateButton && (
            <PrimaryButton size="sm" onClick={handleCreate}>
              Ny profil
            </PrimaryButton>
          )}
        </header>
      )}

      {shouldFilter && (
        <div className="ds-profile-switcher__controls">
          <label className="ds-profile-switcher__search">
            <span className="ds-sr-only">Filtrer profiler</span>
            <input
              type="search"
              value={query}
              onChange={handleQueryChange}
              className="ds-input"
              placeholder="Søg profiler eller scopes"
            />
          </label>
        </div>
      )}

      <div className="ds-profile-switcher__table" role="region" aria-live="polite">
        <table className="ds-profile-table">
          <caption className="ds-sr-only">Gemte profiler</caption>
          <thead>
            <tr>
              <th scope="col">Navn</th>
              <th scope="col">Sidst opdateret</th>
              <th scope="col">Scopes</th>
              <th scope="col" className="ds-profile-table__actions-heading">
                Handlinger
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredProfiles.map((entry) => (
              <tr key={entry.profile.id} data-active={entry.isActive ? 'true' : undefined}>
                <td>
                  <div className="ds-profile-table__name">
                    <span className="ds-heading-xs">{entry.profile.name}</span>
                    {entry.isActive && (
                      <span className="ds-status-badge" data-status="active">
                        Aktiv
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <time className="ds-profile-table__timestamp" dateTime={entry.isoUpdatedAt ?? undefined}>
                    {entry.lastUpdated}
                  </time>
                </td>
                <td>
                  <ul className="ds-profile-table__scopes" role="list">
                    {entry.scopes.map((scope) => (
                      <li key={`${entry.profile.id}-${scope.scope}`}>
                        <span
                          className="ds-status-badge"
                          data-status={scope.isActive ? 'active' : 'inactive'}
                        >
                          {scope.scope}
                        </span>
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="ds-profile-table__actions">
                  <PrimaryButton
                    size="sm"
                    onClick={() => switchProfile(entry.profile.id)}
                    disabled={entry.isActive}
                  >
                    Aktivér
                  </PrimaryButton>
                  <ProfileActionsMenu
                    onRename={() => handleRename(entry.profile.id)}
                    onDuplicate={() => handleDuplicate(entry.profile.id)}
                    onDelete={() => handleDelete(entry.profile.id)}
                    disableDelete={totalProfileCount === 1}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="ds-profile-switcher__list" role="list">
        {filteredProfiles.map((entry) => (
          <li
            key={entry.profile.id}
            className="ds-profile-card ds-card ds-card--muted"
            data-active={entry.isActive ? 'true' : undefined}
          >
            <div className="ds-stack-sm">
              <div className="ds-profile-card__heading">
                <h3 className="ds-heading-sm">{entry.profile.name}</h3>
                {entry.isActive && (
                  <span className="ds-status-badge" data-status="active">
                    Aktiv
                  </span>
                )}
              </div>
              <div className="ds-profile-card__meta">
                <time className="ds-status-badge" data-status="timestamp" dateTime={entry.isoUpdatedAt ?? undefined}>
                  Sidst opdateret {entry.lastUpdated}
                </time>
              </div>
              <div className="ds-cluster">
                {entry.scopes.map((scope) => (
                  <span
                    key={`${entry.profile.id}-${scope.scope}`}
                    className="ds-status-badge"
                    data-status={scope.isActive ? 'active' : 'inactive'}
                  >
                    {scope.scope}
                  </span>
                ))}
              </div>
            </div>

            <div className="ds-profile-card__actions">
              <PrimaryButton
                size="sm"
                onClick={() => switchProfile(entry.profile.id)}
                disabled={entry.isActive}
              >
                Aktivér
              </PrimaryButton>
              <ProfileActionsMenu
                onRename={() => handleRename(entry.profile.id)}
                onDuplicate={() => handleDuplicate(entry.profile.id)}
                onDelete={() => handleDelete(entry.profile.id)}
                disableDelete={totalProfileCount === 1}
              />
            </div>
          </li>
        ))}
      </ul>

      {filteredProfiles.length === 0 && (
        <p className="ds-profile-switcher__empty" role="status">
          Ingen profiler matcher dit filter.
        </p>
      )}
    </section>
  )
}

type ProfileActionsMenuProps = {
  onRename: () => void
  onDuplicate: () => void
  onDelete: () => void
  disableDelete?: boolean
}

function ProfileActionsMenu({ onRename, onDuplicate, onDelete, disableDelete }: ProfileActionsMenuProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const close = useCallback(() => {
    setOpen(false)
  }, [])

  const toggle = useCallback(() => {
    setOpen((value) => !value)
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (target && containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [open])

  return (
    <div className="ds-profile-menu" ref={containerRef}>
      <Tooltip content="Flere handlinger">
        <IconButton
          icon={<KebabIcon />}
          label={open ? 'Luk handlingsmenu' : 'Åbn handlingsmenu'}
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          data-active={open ? 'true' : undefined}
        />
      </Tooltip>

      <div
        className="ds-profile-menu__overlay"
        data-open={open ? 'true' : undefined}
        onClick={close}
        aria-hidden="true"
      />

      <div className="ds-profile-menu__panel" role="menu" data-open={open ? 'true' : undefined}>
        <Tooltip content="Omdøb">
          <IconButton
            icon={<RenameIcon />}
            label="Omdøb profil"
            size="sm"
            onClick={() => {
              onRename()
              close()
            }}
          />
        </Tooltip>
        <Tooltip content="Dupliker">
          <IconButton
            icon={<DuplicateIcon />}
            label="Dupliker profil"
            size="sm"
            onClick={() => {
              onDuplicate()
              close()
            }}
          />
        </Tooltip>
        <Tooltip content="Slet">
          <IconButton
            icon={<DeleteIcon />}
            label="Slet profil"
            size="sm"
            tone="danger"
            disabled={disableDelete}
            onClick={() => {
              onDelete()
              close()
            }}
          />
        </Tooltip>
      </div>
    </div>
  )
}

function KebabIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false">
      <circle cx="8" cy="3" r="1.5" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="8" cy="13" r="1.5" />
    </svg>
  )
}

function RenameIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" focusable="false">
      <path d="M3 14.5v2.5h2.5l9.1-9.1-2.5-2.5L3 14.5z" />
      <path d="M12.4 5.4l2.2-2.2 2.5 2.5-2.2 2.2" />
    </svg>
  )
}

function DuplicateIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" focusable="false">
      <rect x="6" y="6" width="11" height="11" rx="1.8" />
      <path d="M3 13V4a1.5 1.5 0 0 1 1.5-1.5H13" />
    </svg>
  )
}

function DeleteIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" focusable="false">
      <path d="M4 6h12" />
      <path d="M8 6v8" />
      <path d="M12 6v8" />
      <path d="M5 6l.6 9.5A1.5 1.5 0 0 0 7.1 17h5.8a1.5 1.5 0 0 0 1.5-1.5L15 6" />
      <path d="M7.5 4H12.5L13 5.5H7z" />
    </svg>
  )
}
