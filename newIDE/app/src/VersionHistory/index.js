// @flow

import * as React from 'react';
import { I18n } from '@lingui/react';
import { Trans, t } from '@lingui/macro';
import { type I18n as I18nType } from '@lingui/core';
import {
  CLOUD_PROJECT_VERSION_LABEL_MAX_LENGTH,
  type FilledCloudProjectVersion,
} from '../Utils/GDevelopServices/Project';
import {
  getUserPublicProfilesByIds,
  type UserPublicProfileByIds,
} from '../Utils/GDevelopServices/User';
import { Column, Line } from '../UI/Grid';
import Text from '../UI/Text';
import Avatar from '@material-ui/core/Avatar';
import Collapse from '@material-ui/core/Collapse';
import { LineStackLayout } from '../UI/Layout';
import IconButton from '../UI/IconButton';
import ChevronArrowBottom from '../UI/CustomSvgIcons/ChevronArrowBottom';
import ChevronArrowRight from '../UI/CustomSvgIcons/ChevronArrowRight';
import ThreeDotsMenu from '../UI/CustomSvgIcons/ThreeDotsMenu';
import ContextMenu, { type ContextMenuInterface } from '../UI/Menu/ContextMenu';
import {
  shouldCloseOrCancel,
  shouldValidate,
} from '../UI/KeyboardShortcuts/InteractionKeys';
import TextField, { type TextFieldInterface } from '../UI/TextField';
import FlatButton from '../UI/FlatButton';

const thisYear = new Date().getFullYear();

const styles = {
  avatar: {
    width: 20,
    height: 20,
  },
  username: { opacity: 0.7 },
  versionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: 30, // Width of the collapse icon button.
  },
};

type ProjectVersionRowProps = {|
  version: FilledCloudProjectVersion,
  usersPublicProfileByIds: UserPublicProfileByIds,
  isEditing: boolean,
  onRename: (FilledCloudProjectVersion, string) => void,
  onCancelRenaming: () => void,
  onContextMenu: (
    event: PointerEvent,
    version: FilledCloudProjectVersion
  ) => void,
|};

const ProjectVersionRow = ({
  version,
  usersPublicProfileByIds,
  isEditing,
  onRename,
  onCancelRenaming,
  onContextMenu,
}: ProjectVersionRowProps) => {
  const textFieldRef = React.useRef<?TextFieldInterface>(null);
  const [newLabel, setNewLabel] = React.useState<string>(version.label || '');
  const authorPublicProfile = version.userId
    ? usersPublicProfileByIds[version.userId]
    : null;

  const validateNewLabel = () => {
    onRename(version, newLabel);
  };

  return (
    <I18n>
      {({ i18n }) => (
        <Line justifyContent="space-between" alignItems="flex-start">
          <Column noMargin>
            {isEditing ? (
              <TextField
                ref={textFieldRef}
                margin="none"
                value={newLabel}
                translatableHintText={t`End of jam`}
                onChange={(event, text) =>
                  setNewLabel(
                    text.slice(0, CLOUD_PROJECT_VERSION_LABEL_MAX_LENGTH)
                  )
                }
                autoFocus="desktopAndMobileDevices"
                onKeyPress={event => {
                  if (shouldValidate(event)) {
                    validateNewLabel();
                  }
                }}
                onKeyUp={event => {
                  if (shouldCloseOrCancel(event)) {
                    setNewLabel(version.label || '');
                    onCancelRenaming();
                  }
                }}
              />
            ) : version.label ? (
              <LineStackLayout noMargin>
                <Text noMargin>{version.label}</Text>
                <Text noMargin style={styles.username}>
                  {i18n.date(version.createdAt, {
                    hour: 'numeric',
                    minute: 'numeric',
                  })}
                </Text>
              </LineStackLayout>
            ) : (
              <Text noMargin>
                {i18n.date(version.createdAt, {
                  hour: 'numeric',
                  minute: 'numeric',
                })}
              </Text>
            )}

            {authorPublicProfile && (
              <LineStackLayout noMargin>
                <Avatar
                  src={authorPublicProfile.iconUrl}
                  style={styles.avatar}
                />
                <Text noMargin style={styles.username}>
                  {authorPublicProfile.username}
                </Text>
              </LineStackLayout>
            )}
          </Column>
          <IconButton
            size="small"
            onClick={event => {
              onContextMenu(event, version);
            }}
          >
            <ThreeDotsMenu />
          </IconButton>
        </Line>
      )}
    </I18n>
  );
};

type DayGroupRowProps = {|
  day: number,
  versions: FilledCloudProjectVersion[],
  editedVersionId: ?string,
  onRenameVersion: (FilledCloudProjectVersion, string) => void,
  onCancelRenaming: () => void,
  onContextMenu: (
    event: PointerEvent,
    version: FilledCloudProjectVersion
  ) => void,
  usersPublicProfileByIds: UserPublicProfileByIds,
|};

const DayGroupRow = ({
  day,
  versions,
  editedVersionId,
  onRenameVersion,
  onCancelRenaming,
  onContextMenu,
  usersPublicProfileByIds,
}: DayGroupRowProps) => {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const displayYear = new Date(day).getFullYear() !== thisYear;

  return (
    <I18n>
      {({ i18n }) => (
        <React.Fragment>
          <Line alignItems="center">
            <IconButton onClick={() => setIsOpen(!isOpen)} size="small">
              {isOpen ? <ChevronArrowBottom /> : <ChevronArrowRight />}
            </IconButton>
            <Text>
              {i18n.date(day, {
                month: 'short',
                day: 'numeric',
                year: displayYear ? 'numeric' : undefined,
              })}
            </Text>
          </Line>
          <Collapse in={isOpen}>
            <div style={styles.versionsContainer}>
              {versions.map(version => (
                <ProjectVersionRow
                  key={version.id}
                  version={version}
                  onRename={onRenameVersion}
                  onCancelRenaming={onCancelRenaming}
                  usersPublicProfileByIds={usersPublicProfileByIds}
                  isEditing={version.id === editedVersionId}
                  onContextMenu={onContextMenu}
                />
              ))}
            </div>
          </Collapse>
        </React.Fragment>
      )}
    </I18n>
  );
};

type VersionsGroupedByDay = {|
  [day: number]: Array<FilledCloudProjectVersion>,
|};

const groupVersionsByDay = (
  versions: Array<FilledCloudProjectVersion>
): VersionsGroupedByDay => {
  if (versions.length === 0) return {};

  const versionsGroupedByDay = {};
  versions.forEach(version => {
    const dayDate = new Date(version.createdAt.slice(0, 10)).getTime();
    if (!versionsGroupedByDay[dayDate]) {
      versionsGroupedByDay[dayDate] = [version];
    } else {
      versionsGroupedByDay[dayDate].push(version);
    }
  });
  return versionsGroupedByDay;
};

type Props = {|
  versions: Array<FilledCloudProjectVersion>,
  onRenameVersion: (
    FilledCloudProjectVersion,
    {| label: string |}
  ) => Promise<void>,
  onLoadMore: () => Promise<void>,
  canLoadMore: boolean,
|};

const VersionHistory = ({
  versions,
  onRenameVersion,
  onLoadMore,
  canLoadMore,
}: Props) => {
  const [
    usersPublicProfileByIds,
    setUsersPublicProfileByIds,
  ] = React.useState<?UserPublicProfileByIds>();
  const [editedVersionId, setEditedVersionId] = React.useState<?string>(null);
  const [
    isLoadingMoreVersions,
    setIsLoadingMoreVersions,
  ] = React.useState<boolean>(false);
  const contextMenuRef = React.useRef<?ContextMenuInterface>(null);

  const userIdsToFetch = React.useMemo(
    () => versions.map(version => version.userId).filter(Boolean),
    [versions]
  );

  const versionsGroupedByDay = React.useMemo(
    () => groupVersionsByDay(versions),
    [versions]
  );
  const days = Object.keys(versionsGroupedByDay)
    .map(dayStr => Number(dayStr))
    .sort()
    .reverse();

  React.useEffect(
    () => {
      (async () => {
        if (!userIdsToFetch) return;
        if (userIdsToFetch.length === 0) {
          setUsersPublicProfileByIds({});
          return;
        }
        const _usersPublicProfileByIds = await getUserPublicProfilesByIds(
          userIdsToFetch
        );
        setUsersPublicProfileByIds(_usersPublicProfileByIds);
      })();
    },
    [userIdsToFetch]
  );

  const buildVersionMenuTemplate = React.useCallback(
    (i18n: I18nType, options: { version: FilledCloudProjectVersion }) => {
      return [
        {
          label: i18n._(options.version.label ? t`Edit name` : t`Name version`),
          click: () => {
            setEditedVersionId(options.version.id);
          },
        },
      ];
    },
    []
  );

  const renameVersion = React.useCallback(
    (version: FilledCloudProjectVersion, newName: string) => {
      onRenameVersion(version, { label: newName });
      setEditedVersionId(null);
    },
    [onRenameVersion]
  );

  const onCancelRenaming = React.useCallback(() => {
    setEditedVersionId(null);
  }, []);

  const openContextMenu = React.useCallback(
    (event: PointerEvent, version: FilledCloudProjectVersion) => {
      const { current: contextMenu } = contextMenuRef;
      if (!contextMenu) return;
      contextMenu.open(event.clientX, event.clientY, { version });
    },
    []
  );

  const loadMore = React.useCallback(
    async () => {
      setIsLoadingMoreVersions(true);
      try {
        await onLoadMore();
      } finally {
        setIsLoadingMoreVersions(false);
      }
    },
    [onLoadMore]
  );

  if (!usersPublicProfileByIds) return null;

  return (
    <>
      <I18n>
        {({ i18n }) => (
          <Column>
            {days.map(day => {
              const dayVersions = versionsGroupedByDay[day];
              if (!dayVersions || dayVersions.length === 0) return null;
              return (
                <DayGroupRow
                  key={day}
                  versions={dayVersions}
                  day={day}
                  usersPublicProfileByIds={usersPublicProfileByIds}
                  onRenameVersion={renameVersion}
                  onCancelRenaming={onCancelRenaming}
                  onContextMenu={openContextMenu}
                  editedVersionId={editedVersionId}
                />
              );
            })}
            <FlatButton
              primary
              disabled={isLoadingMoreVersions || !canLoadMore}
              label={
                canLoadMore ? (
                  isLoadingMoreVersions ? (
                    <Trans>Loading...</Trans>
                  ) : (
                    <Trans>Show older</Trans>
                  )
                ) : (
                  <Trans>All versions loaded</Trans>
                )
              }
              onClick={loadMore}
            />
          </Column>
        )}
      </I18n>
      <ContextMenu
        ref={contextMenuRef}
        buildMenuTemplate={buildVersionMenuTemplate}
      />
    </>
  );
};

export default VersionHistory;
