import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { colors, spacing } from '../theme';
import { Client, Invoice } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ClientsScreenProps {
  clients: Client[];
  invoices: Invoice[];
  onSaveClient: (client: Client) => void;
  onDeleteClient: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export const ClientsScreen: React.FC<ClientsScreenProps> = ({
  clients,
  invoices,
  onSaveClient,
  onDeleteClient
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const openAddModal = () => {
    setEditingClient(null);
    setName('');
    setAddress('');
    setGstin('');
    setPhone('');
    setEmail('');
    setModalVisible(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setAddress(client.address);
    setGstin(client.gstin);
    setPhone(client.phone);
    setEmail(client.email);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      if (Platform.OS === 'web') alert('Client name is required!');
      else Alert.alert('Error', 'Client name is required!');
      return;
    }

    const clientToSave: Client = {
      id: editingClient ? editingClient.id : `client-${Date.now()}`,
      name: name.trim(),
      address: address.trim(),
      gstin: gstin.trim(),
      phone: phone.trim(),
      email: email.trim(),
      createdAt: editingClient ? editingClient.createdAt : new Date().toISOString()
    };

    onSaveClient(clientToSave);
    setModalVisible(false);
  };

  const handleDelete = async (client: Client) => {
    const doDelete = async () => {
      const res = await onDeleteClient(client.id);
      if (!res.success && res.error) {
        if (Platform.OS === 'web') alert(res.error);
        else Alert.alert('Cannot Delete', res.error);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete client "${client.name}"?`)) {
        await doDelete();
      }
    } else {
      Alert.alert(
        'Delete Client',
        `Are you sure you want to delete client "${client.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete }
        ]
      );
    }
  };

  // Filter clients
  const filteredClients = clients.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.gstin.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.container}>
      {/* Top Search & Add */}
      <View style={styles.topBar}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clients by name, GSTIN, phone..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Ionicons name="person-add" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add Client</Text>
        </TouchableOpacity>
      </View>

      {/* Clients List */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {filteredClients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Clients Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'No clients match your search query.'
                : 'Add clients to easily autofill invoice details.'}
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openAddModal}>
              <Text style={styles.emptyBtnText}>Add First Client</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredClients.map(c => {
            const clientInvoices = invoices.filter(inv => inv.clientId === c.id);
            const totalBilled = clientInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

            return (
              <View key={c.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.clientAvatar}>
                    <Ionicons name="business" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.clientHeaderInfo}>
                    <Text style={styles.clientName}>{c.name}</Text>
                    {c.gstin ? (
                      <Text style={styles.gstinBadge}>GSTIN: {c.gstin}</Text>
                    ) : (
                      <Text style={styles.noGstinBadge}>No GSTIN Registered</Text>
                    )}
                  </View>

                  <View style={styles.headerActions}>
                    <TouchableOpacity
                      style={[styles.actionIconBtn, { backgroundColor: colors.surfaceHover }]}
                      onPress={() => openEditModal(c)}
                    >
                      <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionIconBtn, { backgroundColor: colors.dangerMuted }]}
                      onPress={() => handleDelete(c)}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>

                {c.address ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={15} color={colors.textMuted} />
                    <Text style={styles.detailText}>{c.address}</Text>
                  </View>
                ) : null}

                <View style={styles.contactRow}>
                  {c.phone ? (
                    <View style={styles.contactItem}>
                      <Ionicons name="call-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.contactText}>{c.phone}</Text>
                    </View>
                  ) : null}

                  {c.email ? (
                    <View style={styles.contactItem}>
                      <Ionicons name="mail-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.contactText}>{c.email}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.statInfo}>
                    <Text style={styles.statBold}>{clientInvoices.length}</Text> Invoices Issued
                  </Text>
                  <Text style={styles.statAmount}>
                    Total Billed: <Text style={styles.amountBold}>{formatCurrency(totalBilled)}</Text>
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add / Edit Client Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.modalForm}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Client / Company Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Acme Corp / John Doe"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>GSTIN (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={gstin}
                    onChangeText={setGstin}
                    placeholder="e.g. 23AORPA7441L1ZR"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Phone / Mobile Number</Text>
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="e.g. 9876543210"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="client@example.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Billing Address</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Street, City, State, PIN"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSave}>
                <Text style={styles.modalSaveText}>
                  {editingClient ? 'Save Changes' : 'Create Client'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  topBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13
  },
  addBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    justifyContent: 'center'
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  list: {
    flex: 1
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 40,
    gap: spacing.md
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xxxl,
    marginTop: 40
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.md
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 280
  },
  emptyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: spacing.lg
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  clientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center'
  },
  clientHeaderInfo: {
    flex: 1
  },
  clientName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary
  },
  gstinBadge: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.primary,
    marginTop: 1
  },
  noGstinBadge: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6
  },
  actionIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 2
  },
  detailText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 16
  },
  contactRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    flexWrap: 'wrap'
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  contactText: {
    fontSize: 12,
    color: colors.textSecondary
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
    marginTop: 4
  },
  statInfo: {
    fontSize: 11,
    color: colors.textMuted
  },
  statBold: {
    color: colors.textPrimary,
    fontWeight: '700'
  },
  statAmount: {
    fontSize: 11,
    color: colors.textMuted
  },
  amountBold: {
    color: colors.primary,
    fontWeight: '700'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md
  },
  modalBox: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  modalScroll: {
    padding: spacing.md
  },
  modalForm: {
    gap: spacing.md
  },
  formGroup: {
    gap: 4
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    color: colors.textPrimary,
    fontSize: 13
  },
  textArea: {
    minHeight: 65,
    textAlignVertical: 'top'
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600'
  },
  modalSaveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primary
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  }
});
