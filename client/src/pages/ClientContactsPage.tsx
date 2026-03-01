import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { Plus, Search, Users, Edit, X, Check } from "lucide-react";
import type { ClientContact } from "@shared/schema";

export default function ClientContactsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    clientName: "",
    contactName: "",
    email: "",
    phone: "",
    role: "HR" as "HR" | "PROCUREMENT",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery<ClientContact[]>({
    queryKey: ["/api/client-contacts"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("/api/client-contacts", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-contacts"] });
      toast({ title: "איש קשר נוסף בהצלחה" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/client-contacts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-contacts"] });
      toast({ title: "איש קשר עודכן בהצלחה" });
      resetForm();
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ clientName: "", contactName: "", email: "", phone: "", role: "HR" });
  };

  const startEdit = (contact: ClientContact) => {
    setEditingId(contact.id);
    setFormData({
      clientName: contact.clientName,
      contactName: contact.contactName,
      email: contact.email,
      phone: contact.phone || "",
      role: contact.role as "HR" | "PROCUREMENT",
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleActive = (contact: ClientContact) => {
    updateMutation.mutate({ id: contact.id, data: { isActive: !contact.isActive } });
  };

  const filtered = contacts.filter(
    (c) =>
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hrContacts = filtered.filter((c) => c.role === "HR");
  const procContacts = filtered.filter((c) => c.role === "PROCUREMENT");

  const uniqueClients = Array.from(new Set(contacts.map((c) => c.clientName)));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">אנשי קשר - לקוחות</h2>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }} className="bg-brand-yellow text-foreground hover:bg-brand-yellow/90 rounded-full font-semibold shadow-sm">
          <Plus size={18} className="ml-2" />
          הוספת איש קשר
        </Button>
      </div>

      {showForm && (
        <Card className="shadow-stone rounded-2xl mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? "עריכת איש קשר" : "הוספת איש קשר חדש"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">שם לקוח</label>
                  <Input
                    list="client-names"
                    value={formData.clientName}
                    onChange={(e) => setFormData((p) => ({ ...p, clientName: e.target.value }))}
                    placeholder="שם החברה/הארגון"
                    required
                  />
                  <datalist id="client-names">
                    {uniqueClients.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">שם איש קשר</label>
                  <Input
                    value={formData.contactName}
                    onChange={(e) => setFormData((p) => ({ ...p, contactName: e.target.value }))}
                    placeholder="שם מלא"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">אימייל</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    placeholder="email@company.com"
                    dir="ltr"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">טלפון</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="050-0000000"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">תפקיד</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={formData.role === "HR"}
                        onChange={() => setFormData((p) => ({ ...p, role: "HR" }))}
                        className="accent-brand-blue"
                      />
                      <span>משאבי אנוש (HR)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={formData.role === "PROCUREMENT"}
                        onChange={() => setFormData((p) => ({ ...p, role: "PROCUREMENT" }))}
                        className="accent-brand-blue"
                      />
                      <span>רכש</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={resetForm}>
                  ביטול
                </Button>
                <Button type="submit" className="bg-brand-green text-white hover:bg-brand-green/90 rounded-full font-semibold">
                  {editingId ? "עדכן" : "הוסף"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          className="pr-10"
          placeholder="חיפוש לפי שם לקוח, איש קשר או אימייל..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Tabs defaultValue="hr" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="hr">משאבי אנוש ({hrContacts.length})</TabsTrigger>
          <TabsTrigger value="procurement">רכש ({procContacts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="hr">
          <ContactList contacts={hrContacts} onEdit={startEdit} onToggleActive={toggleActive} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="procurement">
          <ContactList contacts={procContacts} onEdit={startEdit} onToggleActive={toggleActive} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function ContactList({
  contacts,
  onEdit,
  onToggleActive,
  isLoading,
}: {
  contacts: ClientContact[];
  onEdit: (c: ClientContact) => void;
  onToggleActive: (c: ClientContact) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">טוען...</div>;
  }
  if (contacts.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-xl border mt-4">
        <Users className="mx-auto mb-3 text-muted-foreground" size={40} />
        <p className="text-muted-foreground">אין אנשי קשר</p>
      </div>
    );
  }
  return (
    <div className="space-y-3 mt-4">
      {contacts.map((contact) => (
        <motion.div
          key={contact.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-white rounded-2xl shadow-stone hover:shadow-stone-lg transition-shadow p-4 ${!contact.isActive ? "opacity-50" : ""}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{contact.contactName}</h3>
                <Badge variant={contact.isActive ? "default" : "secondary"}>
                  {contact.isActive ? "פעיל" : "לא פעיל"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{contact.clientName}</p>
              <p className="text-sm text-muted-foreground" dir="ltr">{contact.email}</p>
              {contact.phone && <p className="text-sm text-muted-foreground" dir="ltr">{contact.phone}</p>}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => onEdit(contact)}>
                <Edit size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleActive(contact)}
                className={contact.isActive ? "text-red-500" : "text-green-500"}
              >
                {contact.isActive ? <X size={16} /> : <Check size={16} />}
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
